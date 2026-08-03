import { Module } from '@nestjs/common';
import { ProposalsController } from './proposals.controller';
import { ProposalsRepository } from './proposals.repository';
import { ProposalsService } from './proposals.service';

@Module({
  controllers: [ProposalsController],
  providers: [ProposalsRepository, ProposalsService],
  exports: [ProposalsService, ProposalsRepository],
})
export class ProposalsModule {}
