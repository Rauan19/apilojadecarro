export default () => ({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  APP_NAME: process.env.APP_NAME ?? 'EstoqueAuto',
  DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? '',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  UPLOAD_DEST: process.env.UPLOAD_DEST ?? './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE ?? '5242880', 10),
  THROTTLE_TTL: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
  THROTTLE_LIMIT: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  /** Token Invertexto para consulta real por placa (opcional em dev). */
  PLATE_API_TOKEN: process.env.PLATE_API_TOKEN ?? '',
  PLATE_LOOKUP_DEMO: process.env.PLATE_LOOKUP_DEMO ?? 'true',
  /** Evolution API (bot WhatsApp) */
  EVOLUTION_URL: process.env.EVOLUTION_URL ?? 'http://127.0.0.1:8080',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ?? '',
  EVOLUTION_WEBHOOK_URL:
    process.env.EVOLUTION_WEBHOOK_URL ??
    'http://host.docker.internal:3000/api/whatsapp/webhook',
  EVOLUTION_MEDIA_BASE_URL:
    process.env.EVOLUTION_MEDIA_BASE_URL ?? 'http://host.docker.internal:3000',
  /** Mercado Pago — mensalidade que a loja paga pelo EstoqueAuto */
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN ?? '',
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET ?? '',
  /** Sobrescreve o notification_url (útil com ngrok em dev). */
  MP_WEBHOOK_URL: process.env.MP_WEBHOOK_URL ?? '',
  /** Só sandbox: manda a cobrança como pagamento de teste auto-aprovado. */
  MP_TEST_FORCE_APPROVE: process.env.MP_TEST_FORCE_APPROVE ?? 'false',
  /** Duração do ciclo da mensalidade, em dias. */
  BILLING_CYCLE_DAYS: parseInt(process.env.BILLING_CYCLE_DAYS ?? '30', 10),
  /** Quantos dias antes do vencimento o cron emite o PIX do próximo ciclo. */
  BILLING_ISSUE_DAYS_BEFORE: parseInt(
    process.env.BILLING_ISSUE_DAYS_BEFORE ?? '3',
    10,
  ),
  /** Validade do QR Code PIX, em dias. */
  BILLING_PIX_EXPIRES_DAYS: parseInt(
    process.env.BILLING_PIX_EXPIRES_DAYS ?? '3',
    10,
  ),
  /** Dias de tolerância após o vencimento antes de bloquear a loja. */
  BILLING_GRACE_DAYS: parseInt(process.env.BILLING_GRACE_DAYS ?? '5', 10),
  /** Hora (0-23) em que o cron diário de cobrança roda. */
  BILLING_CRON_HOUR: parseInt(process.env.BILLING_CRON_HOUR ?? '9', 10),
  BILLING_TIMEZONE: process.env.BILLING_TIMEZONE ?? 'America/Sao_Paulo',
  /** Redis — sessão do bot WhatsApp (docker compose sobe na 6379). */
  REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
});
