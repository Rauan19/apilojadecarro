import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import {
  CompanyStatus,
  InvoiceStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from './billing.service';
import { MercadoPagoClient } from './mercadopago.client';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_JOB = 'billing-daily';

/**
 * Motor da recorrência: sem débito automático no PIX, é o cron que fecha o
 * ciclo — emite a cobrança do próximo mês, vence a que não foi paga e bloqueia
 * quem passou da carência.
 */
@Injectable()
export class BillingCron implements OnModuleInit {
  private readonly logger = new Logger(BillingCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly billing: BillingService,
    private readonly mercadoPago: MercadoPagoClient,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  /**
   * O horário vem do .env, e decorator não lê config — por isso o job diário
   * é registrado na mão em vez de usar @Cron.
   */
  onModuleInit(): void {
    const hour = this.config.get<number>('BILLING_CRON_HOUR', 9);
    const timeZone = this.config.get<string>(
      'BILLING_TIMEZONE',
      'America/Sao_Paulo',
    );

    const job = new CronJob(
      `0 0 ${hour} * * *`,
      () => {
        void this.runDailyCycle();
      },
      null,
      false,
      timeZone,
    );

    this.scheduler.addCronJob(DAILY_JOB, job);
    job.start();

    this.logger.log(
      `🗓️  Cobrança recorrente agendada para ${String(hour).padStart(2, '0')}:00 (${timeZone})`,
    );
  }

  /** Passada diária sobre todas as assinaturas. */
  async runDailyCycle(): Promise<void> {
    this.logger.log('🔄 Rodando ciclo de cobrança');

    try {
      await this.expireOverduePix();
      await this.issueUpcomingInvoices();
      await this.markPastDue();
      await this.blockAfterGrace();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha no ciclo de cobrança: ${message}`);
    }
  }

  /**
   * Rede de segurança para webhook perdido: reconsulta no Mercado Pago as
   * faturas que ainda estão pendentes.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async reconcilePendingInvoices(): Promise<void> {
    if (!this.mercadoPago.isConfigured()) return;

    const pending = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PENDING,
        providerPaymentId: { not: null },
      },
      take: 100,
      orderBy: { createdAt: 'asc' },
    });

    if (pending.length === 0) return;

    for (const invoice of pending) {
      try {
        const payment = await this.mercadoPago.getPayment(
          invoice.providerPaymentId as string,
        );
        await this.billing.applyPayment(payment);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Não consegui reconciliar a fatura ${invoice.id}: ${message}`,
        );
      }
    }
  }

  /** QR Code venceu sem pagamento. */
  private async expireOverduePix(): Promise<void> {
    const { count } = await this.prisma.invoice.updateMany({
      where: {
        status: InvoiceStatus.PENDING,
        pixExpiresAt: { lt: new Date() },
      },
      data: { status: InvoiceStatus.EXPIRED },
    });

    if (count > 0) {
      this.logger.log(`⌛ ${count} PIX expirado(s)`);
    }
  }

  /** Emite a cobrança do próximo ciclo alguns dias antes do vencimento. */
  private async issueUpcomingInvoices(): Promise<void> {
    if (!this.mercadoPago.isConfigured()) {
      this.logger.warn(
        'MP_ACCESS_TOKEN ausente — pulando emissão de cobranças',
      );
      return;
    }

    const daysBefore = this.config.get<number>('BILLING_ISSUE_DAYS_BEFORE', 3);
    const horizon = new Date(Date.now() + daysBefore * DAY_MS);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
        nextChargeAt: { not: null, lte: horizon },
      },
      include: { plan: true, company: true },
    });

    for (const subscription of subscriptions) {
      try {
        const periodStart = this.billing.periodStartFor(subscription);

        // Já existe cobrança em aberto cobrindo esse ciclo? Não emite de novo.
        const existing = await this.prisma.invoice.findFirst({
          where: {
            subscriptionId: subscription.id,
            status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PAID] },
            periodStart: { gte: periodStart },
          },
        });
        if (existing) continue;

        await this.billing.issueInvoice(
          subscription,
          subscription.company,
          periodStart,
        );

        this.logger.log(
          `🧾 Cobrança emitida para ${subscription.company.name} (${subscription.plan.name})`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Falha ao emitir cobrança da empresa ${subscription.companyId}: ${message}`,
        );
      }
    }
  }

  /** Passou do fim do ciclo pago e não pagou: entra em carência. */
  private async markPastDue(): Promise<void> {
    const graceDays = this.config.get<number>('BILLING_GRACE_DAYS', 5);
    const now = new Date();

    const overdue = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { lt: now },
      },
    });

    for (const subscription of overdue) {
      const graceUntil = new Date(
        (subscription.currentPeriodEnd as Date).getTime() + graceDays * DAY_MS,
      );

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.PAST_DUE, graceUntil },
      });

      this.logger.warn(
        `⚠️  Assinatura ${subscription.id} vencida — carência até ${graceUntil.toLocaleDateString('pt-BR')}`,
      );
    }
  }

  /** Acabou a carência: bloqueia a loja até regularizar. */
  private async blockAfterGrace(): Promise<void> {
    const now = new Date();

    const expired = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.PAST_DUE,
        graceUntil: { not: null, lt: now },
        blockedByBilling: false,
      },
      include: { company: true },
    });

    for (const subscription of expired) {
      // Empresa já bloqueada/inativa pelo Super Admin fica como está.
      if (subscription.company.status !== CompanyStatus.ACTIVE) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { blockedByBilling: false },
        });
        continue;
      }

      await this.prisma.$transaction([
        this.prisma.company.update({
          where: { id: subscription.companyId },
          data: { status: CompanyStatus.BLOCKED },
        }),
        this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { blockedByBilling: true },
        }),
      ]);

      this.logger.warn(
        `🔒 ${subscription.company.name} bloqueada por inadimplência`,
      );
    }
  }
}
