import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { StorefrontController } from './storefront.controller';
import { PublicApiService } from './public-api.service';

@Module({
  controllers: [PublicApiController, StorefrontController],
  providers: [PublicApiService],
  exports: [PublicApiService],
})
export class PublicApiModule {}
