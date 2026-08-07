import { Module } from '@nestjs/common';
import { PublicApiModule } from '../public-api/public-api.module';
import { EvolutionApiClient } from './evolution-api.client';
import { WhatsappBotService } from './whatsapp-bot.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappInstanceService } from './whatsapp-instance.service';
import { WhatsappSessionStore } from './whatsapp-session.store';

@Module({
  imports: [PublicApiModule],
  controllers: [WhatsappController],
  providers: [
    EvolutionApiClient,
    WhatsappInstanceService,
    WhatsappSessionStore,
    WhatsappBotService,
  ],
  exports: [WhatsappInstanceService],
})
export class WhatsappModule {}
