function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export interface ParsedWebhookMessage {
  instanceName: string;
  remoteJid: string;
  text: string;
  fromMe: boolean;
  messageId: string | null;
}

/**
 * Extrai instância/remetente/texto de um payload de webhook `messages.upsert`
 * da Evolution API. Ignora grupos.
 */
export function extractWebhookMessage(payload: unknown): ParsedWebhookMessage | null {
  const root = asRecord(payload);
  if (!root) return null;

  const instanceName = String(root.instance ?? root.instanceName ?? '').trim();
  if (!instanceName) return null;

  const data = asRecord(root.data) ?? root;
  const key = asRecord(data.key) ?? asRecord(asRecord(data.message)?.key);
  const message = asRecord(data.message) ?? asRecord(asRecord(data.data)?.message);

  const remoteJid = String(key?.remoteJid ?? '').trim();
  if (!remoteJid || remoteJid.endsWith('@g.us')) return null;

  const fromMe = Boolean(key?.fromMe);
  const messageId = typeof key?.id === 'string' ? key.id : null;

  let text = '';
  if (message) {
    const buttonsResponse = asRecord(message.buttonsResponseMessage);
    const listResponse = asRecord(message.listResponseMessage);
    const singleSelectReply = asRecord(listResponse?.singleSelectReply);
    if (typeof message.conversation === 'string') {
      text = message.conversation;
    } else if (typeof asRecord(message.extendedTextMessage)?.text === 'string') {
      text = String(asRecord(message.extendedTextMessage)?.text);
    } else if (typeof asRecord(message.imageMessage)?.caption === 'string') {
      text = String(asRecord(message.imageMessage)?.caption);
    } else if (typeof buttonsResponse?.selectedButtonId === 'string') {
      // prioriza o id do botão (estável) sobre o texto exibido
      text = String(buttonsResponse.selectedButtonId);
    } else if (typeof buttonsResponse?.selectedDisplayText === 'string') {
      text = String(buttonsResponse.selectedDisplayText);
    } else if (typeof singleSelectReply?.selectedRowId === 'string') {
      // prioriza o rowId (estável) sobre o título exibido
      text = String(singleSelectReply.selectedRowId);
    } else if (typeof listResponse?.title === 'string') {
      text = String(listResponse.title);
    }
  }

  return { instanceName, remoteJid, text, fromMe, messageId };
}

/**
 * Extrai o destinatário para uso no campo "number" dos endpoints de envio da
 * Evolution API. Preserva JIDs especiais (@lid — endereçamento privado do
 * WhatsApp, @g.us — grupo): a Evolution só reconhece o contato de verdade se
 * mandarmos o JID completo de volta. Só reduz a dígitos puros quando é mesmo
 * um JID de telefone tradicional (@s.whatsapp.net).
 */
export function jidToNumber(remoteJid: string): string {
  if (remoteJid.includes('@lid') || remoteJid.includes('@g.us')) {
    return remoteJid;
  }
  return remoteJid.replace(/@.*/, '').replace(/\D/g, '');
}
