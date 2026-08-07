import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type ConversationStep = 'menu' | 'await_vehicle_choice' | 'await_lead_name';

export interface ConversationState {
  step: ConversationStep;
  vehicles?: Array<{ id: string; label: string }>;
  selectedVehicleId?: string;
  /** Por que chegamos em await_lead_name, quando não veio de um veículo escolhido. */
  leadReason?: 'atendente' | 'financiamento';
  /** Preenchido quando um humano (vendedor) respondeu manualmente pelo WhatsApp
   * conectado — enquanto ativo, o bot não responde automaticamente a esse contato. */
  humanPausedAt?: string;
  updatedAt: string;
}

const SESSION_TTL_SEC = 24 * 60 * 60; // 24h sem atividade → esquece o passo
const MSG_TTL_SEC = 60 * 60; // 1h de dedupe por messageId
const RECENT_TEXT_TTL_SEC = 10;
const RECENT_TEXT_WINDOW_MS = 5000;
/** Depois desse tempo sem atividade humana, o bot volta a responder. */
const HUMAN_PAUSE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

/**
 * Estado de conversa do bot WhatsApp.
 * Preferência: Redis (docker compose). Fallback: memória do processo se o
 * Redis estiver fora — o bot continua, mas perde a sessão no restart.
 */
@Injectable()
export class WhatsappSessionStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappSessionStore.name);
  private redis: Redis | null = null;
  private redisReady = false;

  // Fallback em memória (+ locks locais, que são por processo mesmo)
  private readonly memSessions = new Map<string, ConversationState>();
  private readonly memProcessedIds = new Set<string>();
  private readonly memBotSentIds = new Set<string>();
  private readonly memRecentTexts = new Map<string, { text: string; ts: number }>();
  private readonly locks = new Map<string, Promise<unknown>>();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL', 'redis://127.0.0.1:6379');
    try {
      const client = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 3000,
      });
      client.on('error', (err) => {
        this.redisReady = false;
        this.logger.warn(`Redis erro: ${err.message}`);
      });
      client.on('ready', () => {
        this.redisReady = true;
        this.logger.log(`Redis conectado (${url}) — sessões do bot persistidas`);
      });
      await client.connect();
      await client.ping();
      this.redis = client;
      this.redisReady = true;
    } catch (error) {
      this.redis = null;
      this.redisReady = false;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Redis indisponível (${message}) — bot usando memória (sessão some no restart)`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
      this.redis = null;
      this.redisReady = false;
    }
  }

  private key(instanceName: string, remoteJid: string): string {
    return `${instanceName}:${remoteJid}`;
  }

  private sessionKey(instanceName: string, remoteJid: string): string {
    return `wa:session:${this.key(instanceName, remoteJid)}`;
  }

  private useRedis(): boolean {
    return Boolean(this.redis && this.redisReady);
  }

  /** Retorna true se já processou esse messageId antes (e marca como visto). */
  async isDuplicateMessage(instanceName: string, messageId: string): Promise<boolean> {
    const key = `wa:msg:${instanceName}:${messageId}`;
    if (this.useRedis()) {
      const result = await this.redis!.set(key, '1', 'EX', MSG_TTL_SEC, 'NX');
      return result === null; // null = já existia
    }
    if (this.memProcessedIds.has(key)) return true;
    this.memProcessedIds.add(key);
    if (this.memProcessedIds.size > 500) {
      const oldest = this.memProcessedIds.values().next().value;
      if (oldest) this.memProcessedIds.delete(oldest);
    }
    return false;
  }

  /**
   * Mesmo texto do mesmo contato em poucos segundos (Evolution às vezes
   * reentrega toque de botão com messageId diferente).
   */
  async isRecentDuplicateText(
    instanceName: string,
    remoteJid: string,
    text: string,
  ): Promise<boolean> {
    const key = `wa:recent:${this.key(instanceName, remoteJid)}`;
    const now = Date.now();
    const payload = JSON.stringify({ text, ts: now });

    if (this.useRedis()) {
      const previousRaw = await this.redis!.get(key);
      await this.redis!.set(key, payload, 'EX', RECENT_TEXT_TTL_SEC);
      if (!previousRaw) return false;
      try {
        const previous = JSON.parse(previousRaw) as { text: string; ts: number };
        return previous.text === text && now - previous.ts < RECENT_TEXT_WINDOW_MS;
      } catch {
        return false;
      }
    }

    const mapKey = this.key(instanceName, remoteJid);
    const previous = this.memRecentTexts.get(mapKey);
    this.memRecentTexts.set(mapKey, { text, ts: now });
    if (!previous) return false;
    return previous.text === text && now - previous.ts < RECENT_TEXT_WINDOW_MS;
  }

  async registerBotSentMessage(
    instanceName: string,
    messageId: string | null,
  ): Promise<void> {
    if (!messageId) return;
    const key = `wa:botsent:${instanceName}:${messageId}`;
    if (this.useRedis()) {
      await this.redis!.set(key, '1', 'EX', MSG_TTL_SEC);
      return;
    }
    this.memBotSentIds.add(key);
    if (this.memBotSentIds.size > 500) {
      const oldest = this.memBotSentIds.values().next().value;
      if (oldest) this.memBotSentIds.delete(oldest);
    }
  }

  async isBotSentMessage(instanceName: string, messageId: string): Promise<boolean> {
    const key = `wa:botsent:${instanceName}:${messageId}`;
    if (this.useRedis()) {
      return (await this.redis!.exists(key)) === 1;
    }
    return this.memBotSentIds.has(key);
  }

  /** Executa `fn` em fila por conversa (instância+contato), nunca em paralelo. */
  runExclusive<T>(instanceName: string, remoteJid: string, fn: () => Promise<T>): Promise<T> {
    const key = this.key(instanceName, remoteJid);
    const previous = this.locks.get(key) ?? Promise.resolve();
    const run = previous.then(fn, fn);
    this.locks.set(
      key,
      run.catch(() => undefined),
    );
    return run;
  }

  async get(instanceName: string, remoteJid: string): Promise<ConversationState | null> {
    if (this.useRedis()) {
      const raw = await this.redis!.get(this.sessionKey(instanceName, remoteJid));
      if (!raw) return null;
      try {
        return JSON.parse(raw) as ConversationState;
      } catch {
        return null;
      }
    }
    return this.memSessions.get(this.key(instanceName, remoteJid)) ?? null;
  }

  async set(
    instanceName: string,
    remoteJid: string,
    state: Omit<ConversationState, 'updatedAt'>,
  ): Promise<ConversationState> {
    const next: ConversationState = { ...state, updatedAt: new Date().toISOString() };
    if (this.useRedis()) {
      await this.redis!.set(
        this.sessionKey(instanceName, remoteJid),
        JSON.stringify(next),
        'EX',
        SESSION_TTL_SEC,
      );
      return next;
    }
    this.memSessions.set(this.key(instanceName, remoteJid), next);
    return next;
  }

  async clear(instanceName: string, remoteJid: string): Promise<void> {
    if (this.useRedis()) {
      await this.redis!.del(this.sessionKey(instanceName, remoteJid));
      return;
    }
    this.memSessions.delete(this.key(instanceName, remoteJid));
  }

  /** Registra que um humano respondeu manualmente esse contato agora. */
  async markHumanReply(instanceName: string, remoteJid: string): Promise<void> {
    const current = await this.get(instanceName, remoteJid);
    await this.set(instanceName, remoteJid, {
      ...(current ?? { step: 'menu' }),
      humanPausedAt: new Date().toISOString(),
    });
  }

  /** Bot pausado pra esse contato (vendedor assumiu) e ainda dentro do prazo. */
  async isHumanPaused(instanceName: string, remoteJid: string): Promise<boolean> {
    const session = await this.get(instanceName, remoteJid);
    if (!session?.humanPausedAt) return false;
    const elapsed = Date.now() - new Date(session.humanPausedAt).getTime();
    return elapsed < HUMAN_PAUSE_TTL_MS;
  }

  /** Libera o bot pra voltar a responder esse contato. */
  async clearHumanPause(instanceName: string, remoteJid: string): Promise<void> {
    const current = await this.get(instanceName, remoteJid);
    if (!current?.humanPausedAt) return;
    const { humanPausedAt: _removed, ...rest } = current;
    await this.set(instanceName, remoteJid, rest);
  }
}
