import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { BillingController } from './billing.controller';
import { BillingCron } from './billing.cron';
import { BillingService } from './billing.service';
import { MercadoPagoClient } from './mercadopago.client';

@Module({
  imports: [PlansModule],
  controllers: [BillingController],
  providers: [MercadoPagoClient, BillingService, BillingCron],
  exports: [BillingService],
})
export class BillingModule {}
