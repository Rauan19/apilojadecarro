import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { isValidCnpj, isValidCpf } from '../../common/utils/document.util';

const MP_API_URL = 'https://api.mercadopago.com';

/** Status possíveis de um pagamento no Mercado Pago. */
export type MpPaymentStatus =
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

export interface MpPayment {
  id: number;
  status: MpPaymentStatus;
  status_detail?: string;
  transaction_amount?: number;
  date_approved?: string | null;
  external_reference?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

export interface CreatePixPaymentInput {
  /** Valor em reais. */
  amount: number;
  description: string;
  /** ID da nossa fatura — volta no webhook em external_reference. */
  externalReference: string;
  expiresAt: Date;
  payer: {
    email: string;
    firstName?: string;
    lastName?: string;
    /** CPF ou CNPJ apenas com dígitos. */
    document?: string;
  };
}

@Injectable()
export class MercadoPagoClient {
  private readonly logger = new Logger(MercadoPagoClient.name);

  constructor(private readonly config: ConfigService) {}

  /** Sem access token o módulo roda em modo degradado (dev sem credencial). */
  isConfigured(): boolean {
    return Boolean(this.accessToken());
  }

  private accessToken(): string {
    return this.config.get<string>('MP_ACCESS_TOKEN', '');
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    idempotencyKey?: string,
  ): Promise<T> {
    const token = this.accessToken();
    if (!token) {
      throw new ServiceUnavailableException(
        'Mercado Pago não configurado: defina MP_ACCESS_TOKEN no .env',
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    let response: Response;
    try {
      response = await fetch(`${MP_API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ServiceUnavailableException(
        `Não foi possível falar com o Mercado Pago: ${message}`,
      );
    }

    const text = await response.text();

    if (!response.ok) {
      this.logger.error(
        `⚠️  Mercado Pago ${method} ${path} -> ${response.status}: ${text}`,
      );

      const reason = this.describeError(text);

      // 4xx é problema da nossa requisição ou da configuração da conta: mandar
      // "tente novamente" só faz o usuário repetir um erro que nunca passa.
      if (response.status >= 400 && response.status < 500) {
        throw new BadRequestException(
          `Mercado Pago recusou a cobrança: ${reason}`,
        );
      }

      throw new ServiceUnavailableException(
        `Mercado Pago fora do ar (${response.status}). Tente novamente em instantes.`,
      );
    }

    return (text ? JSON.parse(text) : {}) as T;
  }

  /** Extrai a descrição legível do corpo de erro do Mercado Pago. */
  private describeError(body: string): string {
    try {
      const parsed = JSON.parse(body) as {
        message?: string;
        cause?: Array<{ code?: number | string; description?: string }>;
      };

      const cause = parsed.cause?.[0];
      if (cause?.description) {
        return cause.code
          ? `${cause.description} (código ${cause.code})`
          : cause.description;
      }

      return parsed.message ?? body.slice(0, 200);
    } catch {
      return body.slice(0, 200);
    }
  }

  /**
   * Cria uma cobrança PIX. O retorno já traz o copia e cola e o QR Code em
   * base64, que é o que o painel mostra pro dono da loja.
   */
  async createPixPayment(input: CreatePixPaymentInput): Promise<MpPayment> {
    const identification = this.buildIdentification(input.payer.document);

    // No sandbox não dá pra pagar um PIX de verdade. O Mercado Pago usa o
    // nome do pagador como gatilho de teste: "APRO" pede que a cobrança seja
    // aprovada sozinha. Nunca ligue isso em produção.
    const forceApprove =
      this.config.get<string>('MP_TEST_FORCE_APPROVE', 'false') === 'true';
    const firstName = forceApprove ? 'APRO' : input.payer.firstName;

    if (forceApprove) {
      this.logger.warn(
        '⚠️  MP_TEST_FORCE_APPROVE ligado — cobrança enviada como pagamento de teste',
      );
    }


    const payment = await this.request<MpPayment>(
      'POST',
      '/v1/payments',
      {
        transaction_amount: Number(input.amount.toFixed(2)),
        description: input.description,
        payment_method_id: 'pix',
        external_reference: input.externalReference,
        date_of_expiration: this.toMpDate(input.expiresAt),
        notification_url: this.notificationUrl(),
        payer: {
          email: input.payer.email,
          first_name: firstName,
          last_name: input.payer.lastName,
          ...(identification ? { identification } : {}),
        },
      },
      // A chave é a nossa fatura: se o cron reprocessar, o MP devolve o mesmo
      // pagamento em vez de criar um PIX duplicado.
      `invoice-${input.externalReference}`,
    );

    return payment;
  }

  async getPayment(paymentId: string | number): Promise<MpPayment> {
    return this.request<MpPayment>('GET', `/v1/payments/${paymentId}`);
  }

  /**
   * Valida a assinatura do webhook conforme o esquema do Mercado Pago:
   * HMAC-SHA256 de `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`.
   *
   * Sem MP_WEBHOOK_SECRET configurado a validação é ignorada (dev), mas o
   * status do pagamento nunca vem do corpo da notificação — sempre relemos
   * via API, então um webhook forjado não credita nada sozinho.
   */
  verifyWebhookSignature(params: {
    signatureHeader?: string;
    requestId?: string;
    dataId?: string;
  }): boolean {
    const secret = this.config.get<string>('MP_WEBHOOK_SECRET', '');
    if (!secret) {
      this.logger.warn(
        'MP_WEBHOOK_SECRET não configurado — assinatura do webhook não validada',
      );
      return true;
    }

    const { signatureHeader, requestId, dataId } = params;
    if (!signatureHeader || !dataId) return false;

    const parts = signatureHeader.split(',').reduce<Record<string, string>>(
      (acc, part) => {
        const [key, value] = part.split('=', 2);
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      },
      {},
    );

    const ts = parts.ts;
    const receivedHash = parts.v1;
    if (!ts || !receivedHash) return false;

    // O MP monta o manifest com o data.id em minúsculas quando alfanumérico.
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId ?? ''};ts:${ts};`;
    const expectedHash = createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    const received = Buffer.from(receivedHash, 'utf8');
    const expected = Buffer.from(expectedHash, 'utf8');
    if (received.length !== expected.length) return false;

    return timingSafeEqual(received, expected);
  }

  /** Chave de idempotência para chamadas que não têm uma âncora natural. */
  newIdempotencyKey(): string {
    return randomUUID();
  }

  private notificationUrl(): string {
    const configured = this.config.get<string>('MP_WEBHOOK_URL', '');
    if (configured) return configured;

    const appUrl = this.config
      .get<string>('APP_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
    return `${appUrl}/api/billing/webhooks/mercadopago`;
  }

  private buildIdentification(
    document?: string,
  ): { type: string; number: string } | null {
    const digits = (document ?? '').replace(/\D/g, '');
    // Documento com dígito verificador errado é recusado pelo Mercado Pago
    // ("Invalid user identification number", 2067). Melhor nem mandar.
    if (digits.length === 11 && isValidCpf(digits)) {
      return { type: 'CPF', number: digits };
    }
    if (digits.length === 14 && isValidCnpj(digits)) {
      return { type: 'CNPJ', number: digits };
    }
    return null;
  }

  /**
   * O Mercado Pago exige data com offset explícito (ex.: 2026-08-09T23:59:59.000-03:00).
   * `toISOString()` sozinho manda "Z" e o PIX volta com validade errada.
   */
  private toMpDate(date: Date): string {
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const pad = (n: number, size = 2) => String(n).padStart(size, '0');

    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
      `.${pad(date.getMilliseconds(), 3)}` +
      `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
    );
  }
}
