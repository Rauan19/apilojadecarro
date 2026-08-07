import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { ApiTokenMiddleware } from './common/middleware/api-token.middleware';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { CustomersModule } from './modules/customers/customers.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ApiTokensModule } from './modules/api-tokens/api-tokens.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { LogsModule } from './modules/logs/logs.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PlansModule } from './modules/plans/plans.module';
import { BillingModule } from './modules/billing/billing.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true, translateTime: 'HH:MM:ss' },
              }
            : undefined,
        // sem isso, cada requisição loga um JSON gigante com todos os headers
        // (é o que lotava o terminal de log em toda chamada do webhook)
        serializers: {
          req: (req: { method: string; url: string }) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
        },
        // não loga o polling de status do WhatsApp (frontend bate nisso a cada poucos segundos)
        autoLogging: {
          ignore: (req: { url?: string }) => req.url === '/api/whatsapp/status',
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60) * 1000,
        limit: Number(process.env.THROTTLE_LIMIT ?? 100),
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    PlansModule,
    BillingModule,
    UsersModule,
    VehiclesModule,
    CustomersModule,
    LeadsModule,
    ProposalsModule,
    SellersModule,
    DashboardModule,
    ApiTokensModule,
    PublicApiModule,
    SchedulesModule,
    LogsModule,
    SettingsModule,
    UploadsModule,
    WhatsappModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Depois do JwtAuthGuard: precisa do usuário já resolvido na request.
    { provide: APP_GUARD, useClass: SubscriptionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ApiTokenMiddleware)
      .forRoutes(
        { path: 'public', method: RequestMethod.ALL },
        { path: 'public/(.*)', method: RequestMethod.ALL },
      );
  }
}
