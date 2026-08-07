import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { SetBotEnabledDto } from './dto/set-bot-enabled.dto';
import { WhatsappBotService } from './whatsapp-bot.service';
import { WhatsappInstanceService } from './whatsapp-instance.service';
import { extractWebhookMessage } from './whatsapp-webhook.util';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly instances: WhatsappInstanceService,
    private readonly bot: WhatsappBotService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Status da conexão WhatsApp da loja' })
  @ApiQuery({ name: 'companyId', required: false })
  async status(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.instances.getStatus(user, companyId);
    return { message: 'Status WhatsApp', data };
  }

  @Post('connect')
  @ApiOperation({ summary: 'Criar/conectar instância WhatsApp (QR Code)' })
  @ApiQuery({ name: 'companyId', required: false })
  async connect(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.instances.connect(user, companyId);
    return { message: 'Escaneie o QR Code no WhatsApp', data };
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Desconectar e remover instância WhatsApp' })
  @ApiQuery({ name: 'companyId', required: false })
  async disconnect(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.instances.disconnect(user, companyId);
    return { message: 'WhatsApp desconectado', data };
  }

  @Patch('bot-enabled')
  @ApiOperation({ summary: 'Ativar ou desativar o bot de veículos' })
  @ApiQuery({ name: 'companyId', required: false })
  async setBotEnabled(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetBotEnabledDto,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.instances.setBotEnabled(user, dto.enabled, companyId);
    return {
      message: dto.enabled ? 'Bot ativado' : 'Bot desativado',
      data,
    };
  }

  @Post('webhook')
  @Public()
  @Roles()
  @ApiOperation({ summary: 'Webhook de eventos da Evolution API (sem auth JWT)' })
  async webhook(@Body() payload: unknown) {
    // Responde rápido e processa depois, evitando retry da Evolution.
    const message = extractWebhookMessage(payload);
    if (message) {
      this.bot.handleWebhookEvent(payload, message).catch((error) => {
        this.logger.error('Erro ao processar mensagem do bot', error as Error);
      });
    }
    return { received: true };
  }
}
