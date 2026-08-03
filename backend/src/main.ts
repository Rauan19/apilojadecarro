import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ApiLoggingInterceptor } from './common/interceptors/api-logging.interceptor';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const prisma = app.get(PrismaService);

  app.useLogger(app.get(Logger));

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: config.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new ApiLoggingInterceptor(prisma),
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('LojaDeCarro SaaS API')
    .setDescription(
      'API REST multi-tenant para gerenciamento de lojas de veículos. ' +
        'Autenticação via JWT (usuários) ou Bearer Token de API (integrações). ' +
        'No painel do Super Admin, Companies são os clientes SaaS (lojas/concessionárias).',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT de usuário do painel',
      },
      'access-token',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description:
          'Token de API do cliente (loja). Envie como: Bearer <token_64_hex>',
      },
      'api-token',
    )
    .addTag('Auth', 'Autenticação e sessão')
    .addTag('Companies', 'Clientes SaaS — lojas e concessionárias (Super Admin)')
    .addTag('Users', 'Gestão de usuários')
    .addTag('Vehicles', 'Estoque de veículos')
    .addTag('Customers', 'Clientes finais da loja (compradores)')
    .addTag('Leads', 'Leads e funil de vendas')
    .addTag('Proposals', 'Propostas comerciais')
    .addTag('Sellers', 'Vendedores')
    .addTag('Dashboard', 'Indicadores e métricas')
    .addTag('API Tokens', 'Tokens de integração por cliente (Super Admin)')
    .addTag('Public API', 'API pública para sites e integrações (Bearer API Token)')
    .addTag('Schedules', 'Agendamentos')
    .addTag('Logs', 'Logs de API (Super Admin)')
    .addTag('Settings', 'Configurações da loja')
    .addTag('Uploads', 'Upload de arquivos')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
