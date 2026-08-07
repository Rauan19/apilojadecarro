import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Company, Role } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { EvolutionApiClient } from './evolution-api.client';

export const INSTANCE_PREFIX = 'estoqueauto_';

export interface WhatsappBotSettings {
  instanceName?: string;
  status?: string;
  botEnabled?: boolean;
  connectedAt?: string | null;
}

export interface WhatsappStatusResponse {
  connected: boolean;
  status: string;
  instanceName: string | null;
  qrcode: string | null;
  botEnabled: boolean;
}

@Injectable()
export class WhatsappInstanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly evolution: EvolutionApiClient,
  ) {}

  async getStatus(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): Promise<WhatsappStatusResponse> {
    const company = await this.findCompanyForUser(user, companyIdParam);
    const bot = this.readBotSettings(company.settings);

    if (!bot.instanceName) {
      return {
        connected: false,
        status: 'not_configured',
        instanceName: null,
        qrcode: null,
        botEnabled: false,
      };
    }

    try {
      const state = await this.evolution.connectionState(bot.instanceName);
      const status = state.instance?.state ?? state.state ?? 'close';
      const connected = status === 'open';
      let qrcode: string | null = null;
      if (!connected) {
        qrcode = await this.evolution.fetchQrCode(bot.instanceName);
      }

      await this.patchBotSettings(company.id, company.settings, {
        ...bot,
        status,
        connectedAt: connected ? (bot.connectedAt ?? new Date().toISOString()) : null,
      });

      return {
        connected,
        status,
        instanceName: bot.instanceName,
        qrcode,
        botEnabled: bot.botEnabled ?? false,
      };
    } catch {
      return {
        connected: false,
        status: bot.status ?? 'unknown',
        instanceName: bot.instanceName,
        qrcode: await this.evolution.fetchQrCode(bot.instanceName).catch(() => null),
        botEnabled: bot.botEnabled ?? false,
      };
    }
  }

  async connect(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): Promise<WhatsappStatusResponse> {
    const company = await this.findCompanyForUser(user, companyIdParam);
    const instanceName = this.buildInstanceName(company.slug);
    const webhookUrl = this.config.get<string>(
      'EVOLUTION_WEBHOOK_URL',
      'http://host.docker.internal:3000/api/whatsapp/webhook',
    );

    try {
      await this.evolution.createInstance({ instanceName, webhookUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      // Evolution 2.3+ devolve 403 "already in use"; versões antigas usam 409/exist.
      const alreadyExists =
        lower.includes('already in use') ||
        lower.includes('in use') ||
        lower.includes('already exists') ||
        lower.includes('exist') ||
        message.includes('409');
      if (!alreadyExists) {
        throw error;
      }
      // instância já existe: segue para buscar o QR
    }

    // Necessário mesmo com createInstance: em instância já existente o create
    // acima é ignorado, então sem isto o webhook nunca seria (re)aplicado.
    await this.evolution.setWebhook(instanceName, webhookUrl);

    const qrcode = await this.evolution.fetchQrCode(instanceName);
    const existingBot = this.readBotSettings(company.settings);

    await this.patchBotSettings(company.id, company.settings, {
      instanceName,
      status: 'connecting',
      botEnabled: existingBot.botEnabled ?? true,
      connectedAt: null,
    });

    return {
      connected: false,
      status: 'connecting',
      instanceName,
      qrcode,
      botEnabled: existingBot.botEnabled ?? true,
    };
  }

  async disconnect(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): Promise<WhatsappStatusResponse> {
    const company = await this.findCompanyForUser(user, companyIdParam);
    const bot = this.readBotSettings(company.settings);

    if (bot.instanceName) {
      await this.evolution.logout(bot.instanceName);
      await this.evolution.deleteInstance(bot.instanceName);
    }

    await this.patchBotSettings(company.id, company.settings, {
      instanceName: undefined,
      status: 'disconnected',
      botEnabled: false,
      connectedAt: null,
    });

    return {
      connected: false,
      status: 'disconnected',
      instanceName: null,
      qrcode: null,
      botEnabled: false,
    };
  }

  async setBotEnabled(
    user: AuthenticatedUser,
    enabled: boolean,
    companyIdParam?: string,
  ): Promise<WhatsappStatusResponse> {
    const company = await this.findCompanyForUser(user, companyIdParam);
    const bot = this.readBotSettings(company.settings);

    if (!bot.instanceName) {
      throw new BadRequestException(
        'Conecte o WhatsApp antes de ativar o bot',
      );
    }

    await this.patchBotSettings(company.id, company.settings, {
      ...bot,
      botEnabled: enabled,
    });

    return this.getStatus(user, companyIdParam);
  }

  buildInstanceName(slug: string): string {
    return `${INSTANCE_PREFIX}${slug}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  }

  readBotSettings(raw: string | null): WhatsappBotSettings {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const bot = parsed.whatsappBot;
      if (bot && typeof bot === 'object') return bot as WhatsappBotSettings;
      return {};
    } catch {
      return {};
    }
  }

  private async patchBotSettings(
    companyId: string,
    currentRaw: string | null,
    bot: WhatsappBotSettings,
  ): Promise<void> {
    let current: Record<string, unknown> = {};
    if (currentRaw) {
      try {
        current = JSON.parse(currentRaw) as Record<string, unknown>;
      } catch {
        current = {};
      }
    }
    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        settings: JSON.stringify({
          ...current,
          whatsappBot: bot,
        }),
      },
    });
  }

  private async findCompanyForUser(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): Promise<Company> {
    const companyId =
      user.role === Role.SUPER_ADMIN ? (companyIdParam ?? user.companyId) : user.companyId;

    if (!companyId) {
      throw new BadRequestException('Informe companyId');
    }

    if (
      user.role !== Role.SUPER_ADMIN &&
      companyIdParam &&
      companyIdParam !== user.companyId
    ) {
      throw new ForbiddenException('Acesso negado à empresa');
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }
    return company;
  }
}
