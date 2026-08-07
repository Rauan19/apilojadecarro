/**
 * Confirma a fatura em aberto como se o PIX tivesse sido pago.
 * Uso: npm run billing:pay
 *
 * Existe porque o sandbox do Mercado Pago não deixa pagar um PIX de verdade.
 * Roda a mesma lógica do webhook (BillingService.markInvoicePaid), então o
 * ciclo é estendido e a loja desbloqueada exatamente como em produção.
 *
 * Só para desenvolvimento — não use com banco de produção.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BillingService } from '../src/modules/billing/billing.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Recusado: este script não roda com NODE_ENV=production');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const prisma = app.get(PrismaService);
    const billing = app.get(BillingService);

    const invoice = await prisma.invoice.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: { company: true, subscription: { include: { plan: true } } },
    });

    if (!invoice) {
      console.log('Nenhuma fatura em aberto. Assine um plano no painel antes.');
      return;
    }

    await billing.markInvoicePaid(invoice.id, new Date());

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: invoice.subscriptionId },
    });

    console.log(`loja .............. ${invoice.company.name}`);
    console.log(`plano ............. ${invoice.subscription.plan.name}`);
    console.log(`valor ............. R$ ${invoice.amount.toFixed(2)}`);
    console.log(`assinatura ........ ${subscription.status}`);
    console.log(
      `ciclo liberado .... ${subscription.currentPeriodStart?.toLocaleDateString('pt-BR')} a ${subscription.currentPeriodEnd?.toLocaleDateString('pt-BR')}`,
    );
    console.log(
      `proxima cobranca .. ${subscription.nextChargeAt?.toLocaleDateString('pt-BR')}`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
