/**
 * Zera os dados de cobrança para testar a assinatura do zero.
 * Uso: npm run billing:reset
 *
 * Apaga faturas, assinaturas e eventos de webhook, e desbloqueia as empresas
 * que ficaram BLOCKED por inadimplência. Não mexe nos planos.
 */
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    const blocked = await prisma.subscription.findMany({
      where: { blockedByBilling: true },
      select: { companyId: true },
    });

    const invoices = await prisma.invoice.deleteMany({});
    const subscriptions = await prisma.subscription.deleteMany({});
    const events = await prisma.webhookEvent.deleteMany({});

    // Só reativa quem o próprio billing bloqueou: bloqueio manual do Super
    // Admin continua valendo.
    let unblocked = 0;
    if (blocked.length > 0) {
      const result = await prisma.company.updateMany({
        where: {
          id: { in: blocked.map((item) => item.companyId) },
          status: "BLOCKED",
        },
        data: { status: "ACTIVE" },
      });
      unblocked = result.count;
    }

    console.log(`faturas removidas ......... ${invoices.count}`);
    console.log(`assinaturas removidas ..... ${subscriptions.count}`);
    console.log(`eventos de webhook ........ ${events.count}`);
    console.log(`empresas desbloqueadas .... ${unblocked}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
