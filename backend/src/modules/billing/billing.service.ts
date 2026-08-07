import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Company,
  CompanyStatus,
  Invoice,
  InvoiceStatus,
  Prisma,
  Role,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { isValidCpfOrCnpj } from '../../common/utils/document.util';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadoPagoClient, MpPayment } from './mercadopago.client';
import { SubscribeDto } from './dto/subscribe.dto';

export type InvoiceResponse = {
  id: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;
  paidAt: Date | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixTicketUrl: string | null;
  pixExpiresAt: Date | null;
  createdAt: Date;
};

export type SubscriptionResponse = {
  id: string;
  status: SubscriptionStatus;
  method: string;
  plan: { id: string; name: string; slug: string; priceMonthly: number };
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  nextChargeAt: Date | null;
  graceUntil: Date | null;
  canceledAt: Date | null;
  /** Dias restantes do ciclo pago (negativo = vencido há N dias). */
  daysRemaining: number | null;
  companyStatus: CompanyStatus;
  /** true = bloqueada por inadimplência (pagar resolve); false = bloqueio
   * manual do Super Admin, que só ele desfaz. */
  blockedByBilling: boolean;
  /** Fatura em aberto com PIX válido, se houver. */
  openInvoice: InvoiceResponse | null;
};

type SubscriptionWithPlan = Subscription & { plan: SubscriptionPlan };

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mercadoPago: MercadoPagoClient,
  ) {}

  // ---------------------------------------------------------------- painel

  async getSubscription(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): Promise<SubscriptionResponse | null> {
    const companyId = this.resolveCompanyId(user, companyIdParam);
    const company = await this.findCompany(companyId);

    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (!subscription) return null;

    const openInvoice = await this.findOpenInvoice(subscription.id);
    return this.toSubscriptionResponse(subscription, company, openInvoice);
  }

  async listInvoices(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): Promise<InvoiceResponse[]> {
    const companyId = this.resolveCompanyId(user, companyIdParam);

    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });

    return invoices.map((invoice) => this.toInvoiceResponse(invoice));
  }

  /**
   * Assina um plano ou troca o plano atual. Gera a cobrança PIX do primeiro
   * ciclo na hora — é o que o painel mostra como QR Code.
   */
  async subscribe(
    user: AuthenticatedUser,
    dto: SubscribeDto,
    companyIdParam?: string,
  ): Promise<SubscriptionResponse> {
    const companyId = this.resolveCompanyId(user, companyIdParam);
    const company = await this.findCompany(companyId);

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    if (!plan.active) {
      throw new BadRequestException('Este plano não está mais disponível');
    }
    // Plano exclusivo pertence a uma loja só — nem o Super Admin assina em nome
    // de outra empresa por engano.
    if (plan.companyId && plan.companyId !== companyId) {
      throw new ForbiddenException(
        'Este plano é exclusivo de outra loja',
      );
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    // Trocar de plano com a assinatura em dia não gera cobrança nova: o valor
    // novo entra no próximo ciclo, sem proporcional.
    if (
      existing &&
      existing.status === SubscriptionStatus.ACTIVE &&
      existing.planId !== plan.id
    ) {
      const updated = await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { planId: plan.id },
        include: { plan: true },
      });

      // Se já havia PIX emitido pro próximo ciclo, ele está com o valor antigo.
      await this.prisma.invoice.updateMany({
        where: { subscriptionId: existing.id, status: InvoiceStatus.PENDING },
        data: { status: InvoiceStatus.CANCELED },
      });

      await this.prisma.company.update({
        where: { id: companyId },
        data: { planId: plan.id },
      });

      const refreshed = await this.findCompany(companyId);
      return this.toSubscriptionResponse(updated, refreshed, null);
    }

    if (existing && existing.status === SubscriptionStatus.ACTIVE) {
      // Mesmo plano, assinatura em dia: nada a cobrar.
      const openInvoice = await this.findOpenInvoice(existing.id);
      return this.toSubscriptionResponse(existing, company, openInvoice);
    }

    const subscription = existing
      ? await this.prisma.subscription.update({
          where: { id: existing.id },
          data: {
            planId: plan.id,
            status: SubscriptionStatus.PENDING,
            canceledAt: null,
          },
          include: { plan: true },
        })
      : await this.prisma.subscription.create({
          data: {
            companyId,
            planId: plan.id,
            status: SubscriptionStatus.PENDING,
          },
          include: { plan: true },
        });

    await this.prisma.company.update({
      where: { id: companyId },
      data: { planId: plan.id },
    });

    // Cobranças antigas em aberto não valem mais.
    await this.prisma.invoice.updateMany({
      where: { subscriptionId: subscription.id, status: InvoiceStatus.PENDING },
      data: { status: InvoiceStatus.CANCELED },
    });

    const periodStart = this.periodStartFor(subscription);
    const invoice = await this.issueInvoice(subscription, company, periodStart);

    const refreshedCompany = await this.findCompany(companyId);
    const refreshedSub = await this.prisma.subscription.findUniqueOrThrow({
      where: { id: subscription.id },
      include: { plan: true },
    });

    return this.toSubscriptionResponse(refreshedSub, refreshedCompany, invoice);
  }

  /**
   * Gera um PIX novo para uma fatura em aberto. Usado quando o QR expirou —
   * o Mercado Pago não permite reabrir um pagamento vencido, então a fatura
   * antiga é encerrada e uma nova é emitida para o mesmo ciclo.
   */
  async refreshInvoicePix(
    user: AuthenticatedUser,
    invoiceId: string,
    companyIdParam?: string,
  ): Promise<InvoiceResponse> {
    const companyId = this.resolveCompanyId(user, companyIdParam);
    const company = await this.findCompany(companyId);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { subscription: { include: { plan: true } } },
    });

    if (!invoice || invoice.companyId !== companyId) {
      throw new NotFoundException('Fatura não encontrada');
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Esta fatura já foi paga');
    }

    // Ainda válido: devolve o mesmo QR em vez de gerar cobrança duplicada.
    if (
      invoice.status === InvoiceStatus.PENDING &&
      invoice.pixQrCode &&
      invoice.pixExpiresAt &&
      invoice.pixExpiresAt.getTime() > Date.now()
    ) {
      return this.toInvoiceResponse(invoice);
    }

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: InvoiceStatus.EXPIRED },
    });

    const fresh = await this.issueInvoice(
      invoice.subscription,
      company,
      invoice.periodStart,
      invoice.periodEnd,
    );

    return this.toInvoiceResponse(fresh);
  }

  async cancel(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): Promise<SubscriptionResponse> {
    const companyId = this.resolveCompanyId(user, companyIdParam);
    const company = await this.findCompany(companyId);

    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
    if (!subscription) {
      throw new NotFoundException('Nenhuma assinatura ativa');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
        nextChargeAt: null,
      },
      include: { plan: true },
    });

    // O que já foi pago continua valendo até o fim do ciclo; só não renova.
    await this.prisma.invoice.updateMany({
      where: { subscriptionId: subscription.id, status: InvoiceStatus.PENDING },
      data: { status: InvoiceStatus.CANCELED },
    });

    return this.toSubscriptionResponse(updated, company, null);
  }

  // ------------------------------------------------------------- cobrança

  /**
   * Cria a fatura do ciclo e emite o PIX no Mercado Pago.
   * Plano gratuito (preço 0) é ativado direto, sem passar pelo provedor.
   */
  async issueInvoice(
    subscription: SubscriptionWithPlan,
    company: Company,
    periodStart: Date,
    periodEndOverride?: Date,
  ): Promise<Invoice> {
    const cycleDays = this.config.get<number>('BILLING_CYCLE_DAYS', 30);
    const periodEnd =
      periodEndOverride ?? new Date(periodStart.getTime() + cycleDays * DAY_MS);

    const amount = subscription.plan.priceMonthly;

    // O PIX exige CPF/CNPJ do pagador. Barrar aqui dá um recado que a loja
    // consegue agir, em vez do "Invalid user identification number" do MP.
    if (amount > 0 && !isValidCpfOrCnpj(company.document)) {
      throw new BadRequestException(
        'Cadastre um CPF ou CNPJ válido nos dados da empresa antes de assinar um plano.',
      );
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        companyId: company.id,
        amount,
        status: InvoiceStatus.PENDING,
        dueDate: periodStart > new Date() ? periodStart : new Date(),
        periodStart,
        periodEnd,
      },
    });

    if (amount <= 0) {
      await this.markInvoicePaid(invoice.id, new Date());
      return this.prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    }

    const expiresDays = this.config.get<number>('BILLING_PIX_EXPIRES_DAYS', 3);
    const expiresAt = new Date(Date.now() + expiresDays * DAY_MS);

    const [firstName, ...restName] = (company.name ?? '').trim().split(/\s+/);

    let payment: MpPayment;
    try {
      payment = await this.mercadoPago.createPixPayment({
        amount,
        description: `${this.appName()} — ${subscription.plan.name} (${this.formatDate(periodStart)} a ${this.formatDate(periodEnd)})`,
        externalReference: invoice.id,
        expiresAt,
        payer: {
          email: company.email,
          firstName: firstName || company.name,
          lastName: restName.join(' ') || undefined,
          document: company.document ?? undefined,
        },
      });
    } catch (error) {
      // Sem PIX a fatura não serve pra nada: cancela em vez de deixar uma
      // cobrança pendente sem forma de pagar.
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.CANCELED },
      });
      throw error;
    }

    const transactionData = payment.point_of_interaction?.transaction_data;

    return this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        providerPaymentId: String(payment.id),
        pixQrCode: transactionData?.qr_code ?? null,
        pixQrCodeBase64: transactionData?.qr_code_base64 ?? null,
        pixTicketUrl: transactionData?.ticket_url ?? null,
        pixExpiresAt: expiresAt,
      },
    });
  }

  /**
   * Confirma o pagamento e estende o ciclo. Idempotente: chamar duas vezes
   * para a mesma fatura não soma dois meses.
   */
  async markInvoicePaid(invoiceId: string, paidAt: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { subscription: true },
      });

      if (!invoice || invoice.status === InvoiceStatus.PAID) {
        return;
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.PAID, paidAt },
      });

      await tx.subscription.update({
        where: { id: invoice.subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: invoice.periodStart,
          currentPeriodEnd: invoice.periodEnd,
          nextChargeAt: invoice.periodEnd,
          graceUntil: null,
          blockedByBilling: false,
        },
      });

      // Só desbloqueia quem foi bloqueado por inadimplência: bloqueio manual
      // do Super Admin não pode cair por causa de um pagamento.
      if (invoice.subscription.blockedByBilling) {
        await tx.company.update({
          where: { id: invoice.companyId },
          data: { status: CompanyStatus.ACTIVE },
        });
      }
    });

    this.logger.log(`💰 Fatura ${invoiceId} paga — ciclo estendido`);
  }

  // -------------------------------------------------------------- webhook

  /**
   * Processa a notificação do Mercado Pago. O status nunca vem do corpo:
   * relemos o pagamento pela API antes de creditar qualquer coisa.
   */
  async handleMercadoPagoWebhook(
    body: Record<string, unknown>,
    query: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<void> {
    const data = (body?.data ?? {}) as { id?: string | number };
    const dataId = String(data.id ?? query['data.id'] ?? query.id ?? '');
    const type = String(body?.type ?? query.type ?? '');

    if (!dataId) {
      this.logger.warn('Webhook do Mercado Pago sem data.id — ignorado');
      return;
    }

    const valid = this.mercadoPago.verifyWebhookSignature({
      signatureHeader: this.headerValue(headers['x-signature']),
      requestId: this.headerValue(headers['x-request-id']),
      dataId,
    });

    if (!valid) {
      this.logger.warn(`Webhook com assinatura inválida (data.id=${dataId})`);
      throw new ForbiddenException('Assinatura inválida');
    }

    if (type && type !== 'payment') {
      this.logger.log(`Webhook "${type}" ignorado (só tratamos payment)`);
      return;
    }

    const eventId = String(body?.id ?? `${type}:${dataId}`);

    const seen = await this.prisma.webhookEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: 'MERCADO_PAGO',
          providerEventId: eventId,
        },
      },
    });
    if (seen) {
      this.logger.log(`Webhook ${eventId} já processado — ignorado`);
      return;
    }

    const payment = await this.mercadoPago.getPayment(dataId);
    await this.applyPayment(payment);

    // Só marca como processado depois de aplicar: se algo falhar acima, o
    // Mercado Pago reenvia e a gente tenta de novo em vez de perder o evento.
    await this.registerWebhookEvent(eventId, type, body);
  }

  /** Aplica o status de um pagamento do MP na fatura correspondente. */
  async applyPayment(payment: MpPayment): Promise<void> {
    const invoice = await this.findInvoiceForPayment(payment);
    if (!invoice) {
      this.logger.warn(
        `Pagamento ${payment.id} sem fatura correspondente — ignorado`,
      );
      return;
    }

    if (payment.status === 'approved') {
      const paidAt = payment.date_approved
        ? new Date(payment.date_approved)
        : new Date();
      await this.markInvoicePaid(invoice.id, paidAt);
      return;
    }

    if (payment.status === 'refunded' || payment.status === 'charged_back') {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.REFUNDED },
      });
      return;
    }

    if (
      (payment.status === 'cancelled' || payment.status === 'rejected') &&
      invoice.status === InvoiceStatus.PENDING
    ) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.EXPIRED },
      });
    }
  }

  // --------------------------------------------------------------- helpers

  /** Início do próximo ciclo: não perde os dias já pagos de quem renova cedo. */
  periodStartFor(subscription: Subscription): Date {
    const now = new Date();
    if (
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd.getTime() > now.getTime()
    ) {
      return subscription.currentPeriodEnd;
    }
    return now;
  }

  async findOpenInvoice(subscriptionId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({
      where: {
        subscriptionId,
        status: InvoiceStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findInvoiceForPayment(
    payment: MpPayment,
  ): Promise<Invoice | null> {
    if (payment.external_reference) {
      const byReference = await this.prisma.invoice.findUnique({
        where: { id: payment.external_reference },
      });
      if (byReference) return byReference;
    }

    return this.prisma.invoice.findUnique({
      where: { providerPaymentId: String(payment.id) },
    });
  }

  private async registerWebhookEvent(
    eventId: string,
    type: string,
    body: unknown,
  ): Promise<void> {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider: 'MERCADO_PAGO',
          providerEventId: eventId,
          type: type || null,
          payload: JSON.stringify(body ?? {}).slice(0, 8000),
        },
      });
    } catch (error) {
      // Duas notificações iguais chegando juntas: a segunda perde a corrida e
      // não tem problema — creditar é idempotente.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  private headerValue(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
  }

  private resolveCompanyId(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): string {
    if (user.role === Role.SUPER_ADMIN) {
      const targetId = companyIdParam ?? user.companyId;
      if (!targetId) {
        throw new BadRequestException(
          'Informe companyId para gerenciar a assinatura de uma empresa',
        );
      }
      return targetId;
    }

    if (!user.companyId) {
      throw new ForbiddenException('Usuário sem empresa vinculada');
    }

    if (companyIdParam && companyIdParam !== user.companyId) {
      throw new ForbiddenException('Acesso permitido apenas para a sua empresa');
    }

    return user.companyId;
  }

  private async findCompany(id: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }
    return company;
  }

  private appName(): string {
    return this.config.get<string>('APP_NAME', 'EstoqueAuto');
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }

  private toInvoiceResponse(invoice: Invoice): InvoiceResponse {
    return {
      id: invoice.id,
      amount: invoice.amount,
      status: invoice.status,
      dueDate: invoice.dueDate,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      paidAt: invoice.paidAt,
      pixQrCode: invoice.pixQrCode,
      pixQrCodeBase64: invoice.pixQrCodeBase64,
      pixTicketUrl: invoice.pixTicketUrl,
      pixExpiresAt: invoice.pixExpiresAt,
      createdAt: invoice.createdAt,
    };
  }

  private toSubscriptionResponse(
    subscription: SubscriptionWithPlan,
    company: Company,
    openInvoice: Invoice | null,
  ): SubscriptionResponse {
    const daysRemaining = subscription.currentPeriodEnd
      ? Math.ceil(
          (subscription.currentPeriodEnd.getTime() - Date.now()) / DAY_MS,
        )
      : null;

    return {
      id: subscription.id,
      status: subscription.status,
      method: subscription.method,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        slug: subscription.plan.slug,
        priceMonthly: subscription.plan.priceMonthly,
      },
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextChargeAt: subscription.nextChargeAt,
      graceUntil: subscription.graceUntil,
      canceledAt: subscription.canceledAt,
      daysRemaining,
      companyStatus: company.status,
      blockedByBilling: subscription.blockedByBilling,
      openInvoice: openInvoice ? this.toInvoiceResponse(openInvoice) : null,
    };
  }
}
