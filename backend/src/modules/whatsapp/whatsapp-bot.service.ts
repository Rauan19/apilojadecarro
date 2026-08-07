import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeadOrigin } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicApiService } from '../public-api/public-api.service';
import { EvolutionApiClient } from './evolution-api.client';
import { INSTANCE_PREFIX, WhatsappInstanceService } from './whatsapp-instance.service';
import { WhatsappSessionStore } from './whatsapp-session.store';
import { jidToNumber, ParsedWebhookMessage } from './whatsapp-webhook.util';

const MAX_PHOTOS_PER_VEHICLE = 3;

// comando explícito: sempre reseta a conversa pro menu, não importa a etapa atual
const MENU_COMMAND_PATTERN = /^(menu|0)$/i;
// saudação "solta": só mostra o menu se não tiver conversa em andamento —
// não pode interromper o cliente no meio de uma etapa (ex: digitando o nome)
const GREETING_PATTERN = /^(oi+|ol[áa]+|bom\s*dia|boa\s*tarde|boa\s*noite|in[ií]cio)\b/i;

function isMenuCommand(text: string): boolean {
  return MENU_COMMAND_PATTERN.test(text.trim());
}

function isGreeting(text: string): boolean {
  return GREETING_PATTERN.test(text.trim());
}

interface StoreSettings {
  businessHoursStart?: string;
  businessHoursEnd?: string;
}

function parseStoreSettings(raw: string | null): StoreSettings {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoreSettings;
  } catch {
    return {};
  }
}

const DEFAULT_BUSINESS_HOURS = { start: '08:00', end: '18:00' };

/** Horário atual (America/Sao_Paulo) dentro do funcionamento configurado pela loja? */
function isWithinBusinessHours(settings: StoreSettings): boolean {
  const start = settings.businessHoursStart || DEFAULT_BUSINESS_HOURS.start;
  const end = settings.businessHoursEnd || DEFAULT_BUSINESS_HOURS.end;

  const nowParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hour = nowParts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = nowParts.find((p) => p.type === 'minute')?.value ?? '00';
  const nowMinutes = Number(hour) * 60 + Number(minute);

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

const PRICE_RANGES: Array<{
  id: string;
  label: string;
  minPrice?: number;
  maxPrice?: number;
}> = [
  { id: 'p1', label: 'Até R$ 30 mil', maxPrice: 30000 },
  { id: 'p2', label: 'Até R$ 50 mil', maxPrice: 50000 },
  { id: 'p3', label: 'Até R$ 80 mil', maxPrice: 80000 },
  { id: 'p4', label: 'Acima de R$ 80 mil', minPrice: 80000 },
];

interface StockVehicle {
  id: string;
  brand: string;
  model: string;
  version?: string | null;
  year: number;
  price: number;
  mileage?: number | null;
  images?: Array<{ url: string; order?: number }>;
}

@Injectable()
export class WhatsappBotService {
  private readonly logger = new Logger(WhatsappBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly evolution: EvolutionApiClient,
    private readonly instances: WhatsappInstanceService,
    private readonly publicApi: PublicApiService,
    private readonly sessions: WhatsappSessionStore,
  ) {}

  async handleWebhookEvent(payload: unknown, message: ParsedWebhookMessage): Promise<void> {
    // Mensagem "fromMe" pode ser o eco da própria resposta do bot OU o vendedor
    // respondendo na mão pelo mesmo WhatsApp — precisamos diferenciar as duas.
    if (message.fromMe) {
      if (
        message.messageId &&
        this.sessions.isBotSentMessage(message.instanceName, message.messageId)
      ) {
        return; // eco da nossa própria mensagem, nada a fazer
      }
      // vendedor assumiu a conversa manualmente: pausa o bot pra esse contato
      this.sessions.markHumanReply(message.instanceName, message.remoteJid);
      this.logger.log(
        `🧑‍💼 Resposta manual detectada em [${message.instanceName}] ${message.remoteJid} — bot pausado`,
      );
      return;
    }

    const text = message.text.trim();
    if (!text) return;

    if (
      message.messageId &&
      this.sessions.isDuplicateMessage(message.instanceName, message.messageId)
    ) {
      return;
    }

    if (this.sessions.isRecentDuplicateText(message.instanceName, message.remoteJid, text)) {
      this.logger.log(`♻️  Texto repetido em poucos segundos, ignorando: "${text}"`);
      return;
    }

    this.logger.log(`📩 [${message.instanceName}] ${message.remoteJid} → "${text}"`);

    const company = await this.resolveCompanyByInstance(message.instanceName);
    if (!company) {
      this.logger.warn(`Instância sem empresa correspondente: ${message.instanceName}`);
      return;
    }

    const bot = this.instances.readBotSettings(company.settings);
    if (!bot.botEnabled) {
      this.logger.log(`⏸️  Bot desativado para ${company.name}, ignorando mensagem`);
      return;
    }

    // Vendedor assumiu esse contato: só volta a responder se o cliente pedir
    // o menu explicitamente (retomada manual do bot).
    if (
      this.sessions.isHumanPaused(message.instanceName, message.remoteJid) &&
      !isMenuCommand(text)
    ) {
      this.logger.log(
        `⏸️  Bot pausado (atendimento humano ativo) para ${message.remoteJid}, ignorando`,
      );
      return;
    }
    this.sessions.clearHumanPause(message.instanceName, message.remoteJid);

    // Serializa por conversa: evita que duas mensagens quase simultâneas do
    // mesmo cliente sejam processadas em paralelo e gerem resposta duplicada/errada.
    try {
      await this.sessions.runExclusive(message.instanceName, message.remoteJid, () =>
        this.handleIncomingMessage({
          instanceName: message.instanceName,
          companyId: company.id,
          companyName: company.name,
          companySettings: parseStoreSettings(company.settings),
          remoteJid: message.remoteJid,
          text,
        }),
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro processando mensagem de ${message.remoteJid}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private async handleIncomingMessage(params: {
    instanceName: string;
    companyId: string;
    companyName: string;
    companySettings: StoreSettings;
    remoteJid: string;
    text: string;
  }): Promise<void> {
    const { instanceName, companyId, companyName, companySettings, remoteJid } = params;
    const normalized = params.text.toLowerCase();
    const session = this.sessions.get(instanceName, remoteJid);
    const inActiveFlow = Boolean(session) && session!.step !== 'menu';

    if (isMenuCommand(params.text) || !session || (isGreeting(params.text) && !inActiveFlow)) {
      await this.sendMenu(instanceName, remoteJid, companyName);
      return;
    }

    if (session.step === 'menu') {
      if (normalized === 'estoque') {
        await this.sendStock(instanceName, remoteJid, companyId);
        return;
      }
      const range = PRICE_RANGES.find((r) => r.id === params.text.trim());
      if (range) {
        await this.sendStock(instanceName, remoteJid, companyId, {
          label: range.label,
          minPrice: range.minPrice,
          maxPrice: range.maxPrice,
        });
        return;
      }
      if (normalized === 'atendente') {
        await this.sendHandoffPrompt(instanceName, remoteJid, companySettings, 'atendente');
        return;
      }
      if (normalized === 'financiamento') {
        await this.sendHandoffPrompt(instanceName, remoteJid, companySettings, 'financiamento');
        return;
      }

      await this.sendTracked(instanceName, remoteJid, 'Não entendi. Vou te mostrar as opções de novo:');
      await this.sendMenu(instanceName, remoteJid, companyName);
      return;
    }

    if (session.step === 'await_vehicle_choice') {
      const index = Number(params.text.trim());
      const selected = session.vehicles?.[index - 1];
      if (!selected) {
        await this.sendTracked(
          instanceName,
          remoteJid,
          'Não entendi o número. Toque num veículo da lista ou digite *menu*.',
        );
        return;
      }

      await this.sendVehicleDetail(instanceName, remoteJid, companyId, selected.id);

      this.sessions.set(instanceName, remoteJid, {
        step: 'await_lead_name',
        selectedVehicleId: selected.id,
        vehicles: session.vehicles,
      });
      await this.sendTracked(
        instanceName,
        remoteJid,
        `Gostou do *${selected.label}*?\n\nMe diga seu *nome* para registrarmos seu interesse.`,
      );
      return;
    }

    if (session.step === 'await_lead_name') {
      const name = params.text.trim().slice(0, 80);
      const notes = session.selectedVehicleId
        ? 'Lead gerado pelo bot WhatsApp (interesse em veículo)'
        : session.leadReason === 'financiamento'
          ? 'Lead gerado pelo bot WhatsApp (simulação de financiamento)'
          : 'Lead gerado pelo bot WhatsApp (falar com atendente)';
      try {
        await this.createLead(companyId, {
          name,
          phone: jidToNumber(remoteJid),
          vehicleId: session.selectedVehicleId,
          notes,
        });
        await this.sendTracked(
          instanceName,
          remoteJid,
          `Obrigado, *${name}*! ✅\nRecebemos seu contato e um atendente da *${companyName}* vai te chamar em breve.\n\nDigite *menu* se quiser ver o estoque de novo.`,
        );
      } catch (error) {
        this.logger.error('Falha ao criar lead pelo bot', error as Error);
        await this.sendTracked(
          instanceName,
          remoteJid,
          `Anotei seu interesse, *${name}*. Em breve a loja entra em contato.\n\nDigite *menu* para voltar.`,
        );
      }
      this.sessions.clear(instanceName, remoteJid);
    }
  }

  /** sendText que registra o id devolvido, pra reconhecer o próprio eco no webhook. */
  private async sendTracked(instanceName: string, remoteJid: string, text: string): Promise<void> {
    const id = await this.evolution.sendText(instanceName, jidToNumber(remoteJid), text);
    this.sessions.registerBotSentMessage(instanceName, id);
  }

  private async sendMenu(
    instanceName: string,
    remoteJid: string,
    companyName: string,
  ): Promise<void> {
    // Lista em vez de botões: nativo do WhatsApp limita botão de resposta a 3
    // opções, e aqui já são bem mais que isso.
    // Sem "description" nas linhas: o WhatsApp exibe título+descrição juntos
    // quando o cliente toca a opção, e isso lia como uma frase quebrada.
    const id = await this.evolution.sendList(instanceName, {
      number: jidToNumber(remoteJid),
      title: `Olá! Bem-vindo(a) à ${companyName} 🚗`,
      description: 'Como posso ajudar?',
      buttonText: 'Ver opções',
      footerText: 'Toque numa opção abaixo',
      sections: [
        {
          title: 'Estoque',
          rows: [
            { rowId: 'estoque', title: 'Ver estoque de veículos' },
            ...PRICE_RANGES.map((r) => ({ rowId: r.id, title: r.label })),
          ],
        },
        {
          title: 'Atendimento',
          rows: [
            { rowId: 'atendente', title: 'Falar com atendente' },
            { rowId: 'financiamento', title: 'Simular financiamento' },
          ],
        },
      ],
    });
    this.sessions.registerBotSentMessage(instanceName, id);
    this.sessions.set(instanceName, remoteJid, { step: 'menu' });
  }

  private formatBusinessHours(settings: StoreSettings): string {
    const start = settings.businessHoursStart || DEFAULT_BUSINESS_HOURS.start;
    const end = settings.businessHoursEnd || DEFAULT_BUSINESS_HOURS.end;
    return `${start} às ${end}`;
  }

  /** "Falar com atendente" e "Simular financiamento" seguem o mesmo roteiro:
   * checam o horário da loja e pedem o nome pra registrar o lead. */
  private async sendHandoffPrompt(
    instanceName: string,
    remoteJid: string,
    companySettings: StoreSettings,
    reason: 'atendente' | 'financiamento',
  ): Promise<void> {
    const withinHours = isWithinBusinessHours(companySettings);
    const who = reason === 'financiamento' ? 'consultor de financiamento' : 'atendente';

    let message: string;
    if (!withinHours) {
      const hours = this.formatBusinessHours(companySettings);
      message =
        `No momento estamos fora do horário de atendimento (${hours}).\n` +
        `Pode deixar seu *nome* que um ${who} te chama assim que abrirmos.`;
    } else if (reason === 'financiamento') {
      message = 'Show! Me diga seu *nome* que um consultor de financiamento te chama.';
    } else {
      message =
        'Perfeito! 😊 Em instantes um atendente vai te responder por aqui.\n\n' +
        'Enquanto isso, me diga seu *nome*?';
    }

    await this.sendTracked(instanceName, remoteJid, message);
    this.sessions.set(instanceName, remoteJid, { step: 'await_lead_name', leadReason: reason });
  }

  private async sendStock(
    instanceName: string,
    remoteJid: string,
    companyId: string,
    filter?: { label: string; minPrice?: number; maxPrice?: number },
  ): Promise<void> {
    const result = await this.publicApi.findVehicles(companyId, {
      minPrice: filter?.minPrice,
      maxPrice: filter?.maxPrice,
      page: 1,
      limit: 8,
    });
    const vehicles = result.items as StockVehicle[];

    if (!vehicles.length) {
      await this.sendTracked(
        instanceName,
        remoteJid,
        filter
          ? `Não encontrei veículos na faixa *${filter.label}* no momento.\nDigite *menu* para voltar.`
          : 'No momento não há veículos disponíveis.\nDigite *menu* para voltar.',
      );
      this.sessions.set(instanceName, remoteJid, { step: 'menu' });
      return;
    }

    const id = await this.evolution.sendList(instanceName, {
      number: jidToNumber(remoteJid),
      title: filter ? `Veículos ${filter.label}` : 'Estoque disponível',
      description: 'Toque num veículo para ver fotos e detalhes',
      buttonText: 'Ver veículos',
      footerText: 'Digite *menu* pra voltar a qualquer momento',
      sections: [
        {
          title: filter ? `Veículos ${filter.label}` : 'Veículos disponíveis',
          rows: vehicles.map((v, i) => ({
            rowId: String(i + 1),
            title: `${v.brand} ${v.model} ${v.year}`,
            description: this.formatVehicleRowDescription(v),
          })),
        },
      ],
    });
    this.sessions.registerBotSentMessage(instanceName, id);
    this.sessions.set(instanceName, remoteJid, {
      step: 'await_vehicle_choice',
      vehicles: vehicles.map((v) => ({
        id: v.id,
        label: `${v.brand} ${v.model} ${v.year}`,
      })),
    });
  }

  private async sendVehicleDetail(
    instanceName: string,
    remoteJid: string,
    companyId: string,
    vehicleId: string,
  ): Promise<void> {
    const vehicle = (await this.publicApi.findVehicleById(
      companyId,
      vehicleId,
    )) as StockVehicle;

    const number = jidToNumber(remoteJid);
    const images = [...(vehicle.images ?? [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, MAX_PHOTOS_PER_VEHICLE);

    const caption = this.formatVehicleLine(vehicle, 0).replace(/^0\.\s*/, '');

    if (!images.length) {
      await this.sendTracked(instanceName, remoteJid, caption);
      return;
    }

    let sentPhoto = false;
    for (let i = 0; i < images.length; i += 1) {
      const mediaUrl = this.resolvePublicMediaUrl(images[i].url);
      if (!mediaUrl) {
        this.logger.warn(
          `URL de mídia inválida no veículo ${vehicleId}: "${images[i].url}"`,
        );
        continue;
      }

      try {
        const fileName =
          mediaUrl.split('/').pop()?.split('?')[0] || `veiculo-${i + 1}.jpg`;
        this.logger.log(`📸 Enviando foto do veículo ${vehicleId}: ${mediaUrl}`);
        const id = await this.evolution.sendMedia(instanceName, {
          number,
          media: mediaUrl,
          caption: !sentPhoto ? caption : undefined,
          fileName,
        });
        this.sessions.registerBotSentMessage(instanceName, id);
        sentPhoto = true;
      } catch (error) {
        this.logger.warn(
          `Falha ao enviar foto do veículo ${vehicleId} (${mediaUrl}): ${error}`,
        );
      }
    }

    // Se nenhuma foto foi, ainda manda as specs em texto (VPS sem URL pública
    // quebrava o sendMedia e o cliente ficava sem informação nenhuma).
    if (!sentPhoto) {
      await this.sendTracked(instanceName, remoteJid, caption);
    }
  }

  /**
   * Evolution só aceita http(s) público ou base64. Paths relativos e URLs de
   * localhost (salvas em dev) precisam virar o host público da API.
   */
  private resolvePublicMediaUrl(raw: string | null | undefined): string | null {
    const value = (raw ?? '').trim();
    if (!value) return null;

    const publicBase = (
      this.config.get<string>('EVOLUTION_MEDIA_BASE_URL') ||
      this.config.get<string>('APP_URL') ||
      ''
    )
      .trim()
      .replace(/\/$/, '');

    let pathPart = value;

    if (/^https?:\/\//i.test(value)) {
      try {
        const parsed = new URL(value);
        const isLocalHost =
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname === '0.0.0.0' ||
          parsed.hostname === 'host.docker.internal';

        if (!isLocalHost) {
          return value;
        }
        // Foto gravada em dev com localhost — troca pro domínio público.
        pathPart = parsed.pathname + parsed.search;
      } catch {
        return null;
      }
    }

    if (!publicBase || !/^https?:\/\//i.test(publicBase)) {
      this.logger.warn(
        `EVOLUTION_MEDIA_BASE_URL/APP_URL ausente ou inválido ("${publicBase}"). ` +
          'Defina https://api.seu-dominio.com no .env',
      );
      return null;
    }

    const resolved = `${publicBase}/${pathPart.replace(/^\//, '')}`;
    this.logger.debug(`Mídia resolvida: "${value}" → "${resolved}"`);
    return resolved;
  }

  private async createLead(
    companyId: string,
    payload: { name: string; phone: string; notes?: string; vehicleId?: string },
  ): Promise<void> {
    await this.prisma.lead.create({
      data: {
        companyId,
        name: payload.name,
        phone: payload.phone,
        notes: payload.notes,
        vehicleId: payload.vehicleId,
        origin: LeadOrigin.WHATSAPP,
      },
    });
  }

  private formatVehicleLine(vehicle: StockVehicle, index: number): string {
    const version = vehicle.version ? ` ${vehicle.version}` : '';
    const km =
      typeof vehicle.mileage === 'number'
        ? ` · ${vehicle.mileage.toLocaleString('pt-BR')} km`
        : '';
    const prefix = index > 0 ? `${index}. ` : '';
    return `${prefix}${vehicle.brand} ${vehicle.model}${version} (${vehicle.year})${km}\n   ${this.formatPrice(vehicle.price)}`;
  }

  private formatPrice(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private formatVehicleRowDescription(vehicle: StockVehicle): string {
    const km =
      typeof vehicle.mileage === 'number' ? `${vehicle.mileage.toLocaleString('pt-BR')} km · ` : '';
    return `${km}${this.formatPrice(vehicle.price)}`;
  }

  private async resolveCompanyByInstance(instanceName: string) {
    if (!instanceName.startsWith(INSTANCE_PREFIX)) return null;
    const slug = instanceName.slice(INSTANCE_PREFIX.length);
    return this.prisma.company.findUnique({ where: { slug } });
  }
}
