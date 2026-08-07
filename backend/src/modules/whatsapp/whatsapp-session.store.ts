import { Injectable } from '@nestjs/common';

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

const MAX_PROCESSED_IDS = 500;
const MAX_BOT_SENT_IDS = 500;
/** Evolution às vezes reentrega o mesmo toque em botão/lista com um messageId
 * DIFERENTE (não pega no dedupe por id) — sem isso, a repetição é processada
 * como se fosse a resposta da próxima pergunta (ex.: vira "nome" do lead). */
const RECENT_TEXT_WINDOW_MS = 5000;
/** Depois desse tempo sem atividade, o bot volta a responder mesmo sem o
 * vendedor liberar explicitamente (evita ficar pausado pra sempre por esquecimento). */
const HUMAN_PAUSE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

/**
 * Estado de conversa em memória, por processo. Reinicia com o backend —
 * aceitável para v1 (mesmo trade-off do bot standalone que ele substitui).
 */
@Injectable()
export class WhatsappSessionStore {
  private readonly sessions = new Map<string, ConversationState>();
  // Evolution/Baileys pode entregar o mesmo messages.upsert mais de uma vez
  // (multi-device); sem isso o bot responde duplicado pra cada mensagem.
  private readonly processedMessageIds = new Set<string>();
  // IDs das mensagens que o próprio bot enviou, pra diferenciar de mensagem
  // que o vendedor mandou na mão pelo mesmo número (ambas chegam como fromMe).
  private readonly botSentMessageIds = new Set<string>();
  // Serializa o processamento por conversa (evita corrida quando o cliente
  // manda duas mensagens quase juntas).
  private readonly locks = new Map<string, Promise<unknown>>();
  private readonly recentTexts = new Map<string, { text: string; ts: number }>();

  private key(instanceName: string, remoteJid: string): string {
    return `${instanceName}:${remoteJid}`;
  }

  /** Retorna true se já processou esse messageId antes (e marca como visto). */
  isDuplicateMessage(instanceName: string, messageId: string): boolean {
    const key = `${instanceName}:${messageId}`;
    if (this.processedMessageIds.has(key)) {
      return true;
    }
    this.processedMessageIds.add(key);
    if (this.processedMessageIds.size > MAX_PROCESSED_IDS) {
      const oldest = this.processedMessageIds.values().next().value;
      if (oldest) this.processedMessageIds.delete(oldest);
    }
    return false;
  }

  /**
   * Retorna true se o mesmo texto já chegou desse contato há poucos segundos
   * (e marca o texto atual como visto). Rede de segurança pro caso do
   * dedupe por messageId não pegar (ids diferentes pro mesmo toque).
   */
  isRecentDuplicateText(instanceName: string, remoteJid: string, text: string): boolean {
    const key = this.key(instanceName, remoteJid);
    const now = Date.now();
    const previous = this.recentTexts.get(key);
    this.recentTexts.set(key, { text, ts: now });
    if (!previous) return false;
    return previous.text === text && now - previous.ts < RECENT_TEXT_WINDOW_MS;
  }

  /** Marca um messageId como enviado pelo próprio bot. */
  registerBotSentMessage(instanceName: string, messageId: string | null): void {
    if (!messageId) return;
    const key = `${instanceName}:${messageId}`;
    this.botSentMessageIds.add(key);
    if (this.botSentMessageIds.size > MAX_BOT_SENT_IDS) {
      const oldest = this.botSentMessageIds.values().next().value;
      if (oldest) this.botSentMessageIds.delete(oldest);
    }
  }

  isBotSentMessage(instanceName: string, messageId: string): boolean {
    return this.botSentMessageIds.has(`${instanceName}:${messageId}`);
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

  get(instanceName: string, remoteJid: string): ConversationState | null {
    return this.sessions.get(this.key(instanceName, remoteJid)) ?? null;
  }

  set(
    instanceName: string,
    remoteJid: string,
    state: Omit<ConversationState, 'updatedAt'>,
  ): ConversationState {
    const next: ConversationState = { ...state, updatedAt: new Date().toISOString() };
    this.sessions.set(this.key(instanceName, remoteJid), next);
    return next;
  }

  clear(instanceName: string, remoteJid: string): void {
    this.sessions.delete(this.key(instanceName, remoteJid));
  }

  /** Registra que um humano respondeu manualmente esse contato agora. */
  markHumanReply(instanceName: string, remoteJid: string): void {
    const key = this.key(instanceName, remoteJid);
    const current = this.sessions.get(key);
    this.sessions.set(key, {
      ...(current ?? { step: 'menu' }),
      humanPausedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /** Bot pausado pra esse contato (vendedor assumiu) e ainda dentro do prazo. */
  isHumanPaused(instanceName: string, remoteJid: string): boolean {
    const session = this.get(instanceName, remoteJid);
    if (!session?.humanPausedAt) return false;
    const elapsed = Date.now() - new Date(session.humanPausedAt).getTime();
    return elapsed < HUMAN_PAUSE_TTL_MS;
  }

  /** Libera o bot pra voltar a responder esse contato (retomada explícita). */
  clearHumanPause(instanceName: string, remoteJid: string): void {
    const key = this.key(instanceName, remoteJid);
    const current = this.sessions.get(key);
    if (current) {
      delete current.humanPausedAt;
    }
  }
}
