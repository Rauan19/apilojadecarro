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
});
