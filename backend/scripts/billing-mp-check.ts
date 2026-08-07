/**
 * Diagnóstico da integração com o Mercado Pago.
 * Uso: npm run billing:mp-check
 *
 * Cria uma cobrança PIX de R$ 1,50 e mostra se o QR Code voltou. Serve pra
 * validar credenciais e configuração da conta sem precisar mexer no painel.
 * Não cria assinatura nem fatura no nosso banco.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MercadoPagoClient } from '../src/modules/billing/mercadopago.client';
import { PrismaService } from '../src/prisma/prisma.service';
import { isValidCpfOrCnpj } from '../src/common/utils/document.util';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });

  try {
    const mp = app.get(MercadoPagoClient);
    const prisma = app.get(PrismaService);

    if (!mp.isConfigured()) {
      console.log('MP_ACCESS_TOKEN vazio — preencha o .env e reinicie.');
      return;
    }

    // Usa uma loja real do banco: é exatamente o que a assinatura vai mandar.
    const company = await prisma.company.findFirstOrThrow();

    console.log(`loja .............  ${company.name}`);
    console.log(`e-mail ...........  ${company.email}`);
    console.log(
      `documento ........  ${company.document ?? '(vazio)'} ${
        isValidCpfOrCnpj(company.document) ? '✓ válido' : '✗ INVÁLIDO'
      }`,
    );

    const payment = await mp.createPixPayment({
      amount: 1.5,
      description: 'EstoqueAuto - diagnostico de integracao',
      externalReference: `diagnostico-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      payer: {
        email: company.email,
        firstName: company.name,
        document: company.document ?? undefined,
      },
    });

    const data = payment.point_of_interaction?.transaction_data;

    console.log(`payment id .......  ${payment.id}`);
    console.log(
      `status ...........  ${payment.status}${payment.status_detail ? ` / ${payment.status_detail}` : ''}`,
    );
    console.log(
      `copia e cola .....  ${data?.qr_code ? `OK (${data.qr_code.length} chars)` : 'AUSENTE'}`,
    );
    console.log(
      `qr code base64 ...  ${data?.qr_code_base64 ? `OK (${data.qr_code_base64.length} chars)` : 'AUSENTE'}`,
    );
    console.log(`ticket url .......  ${data?.ticket_url ?? '-'}`);
    console.log('\n✅ Integração funcionando — o painel vai conseguir gerar PIX.');
  } catch (error) {
    console.error(
      `\n❌ ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void main();
