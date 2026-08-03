import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller';
import { SellersRepository } from './sellers.repository';
import { SellersService } from './sellers.service';

@Module({
  controllers: [SellersController],
  providers: [SellersRepository, SellersService],
  exports: [SellersService, SellersRepository],
})
export class SellersModule {}
