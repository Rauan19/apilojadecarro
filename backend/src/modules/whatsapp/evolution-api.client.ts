import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EvolutionConnectionState {
  instance?: { state?: string };
  state?: string;
}

export interface EvolutionQrResponse {
  base64?: string;
  qrcode?: { base64?: string };
}

interface EvolutionSendResponse {
  key?: { id?: string };
}

@Injectable()
export class EvolutionApiClient {
  private readonly logger = new Logger(EvolutionApiClient.name);

  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    return this.config
      .get<string>('EVOLUTION_URL', 'http://127.0.0.1:8080')
      .replace(/\/$/, '');
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: this.config.get<string>('EVOLUTION_API_KEY', ''),
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl()}${path}`, {
        method,
        headers: this.headers(),
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ServiceUnavailableException(
        `Não foi possível falar com a Evolution API: ${message}`,
      );
    }

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`⚠️  Evolution ${method} ${path} -> ${response.status}: ${text}`);
      throw new Error(`Evolution ${method} ${path} -> ${response.status}: ${text}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  async createInstance(params: {
    instanceName: string;
    webhookUrl: string;
  }): Promise<void> {
    await this.request('POST', '/instance/create', {
      instanceName: params.instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      webhook: {
        enabled: true,
        url: params.webhookUrl,
        byEvents: false,
        events: ['MESSAGES_UPSERT'],
      },
    });
  }

  /**
   * Configura o webhook explicitamente via /webhook/set. Necessário mesmo após
   * createInstance: em instâncias já existentes o create é ignorado (erro
   * "already in use" engolido), então o webhook nunca seria aplicado sem isto.
   */
  async setWebhook(instanceName: string, webhookUrl: string): Promise<void> {
    await this.request('POST', `/webhook/set/${instanceName}`, {
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        events: ['MESSAGES_UPSERT'],
      },
    });
  }

  async connectionState(instanceName: string): Promise<EvolutionConnectionState> {
    return this.request<EvolutionConnectionState>(
      'GET',
      `/instance/connectionState/${instanceName}`,
    );
  }

  async fetchQrCode(instanceName: string): Promise<string | null> {
    try {
      const data = await this.request<EvolutionQrResponse>(
        'GET',
        `/instance/connect/${instanceName}`,
      );
      return data.base64 ?? data.qrcode?.base64 ?? null;
    } catch {
      return null;
    }
  }

  async logout(instanceName: string): Promise<void> {
    try {
      await this.request('DELETE', `/instance/logout/${instanceName}`);
    } catch {
      // instância pode já estar desconectada
    }
  }

  async deleteInstance(instanceName: string): Promise<void> {
    try {
      await this.request('DELETE', `/instance/delete/${instanceName}`);
    } catch {
      // instância pode já não existir
    }
  }

  async sendText(instanceName: string, number: string, text: string): Promise<string | null> {
    const res = await this.request<EvolutionSendResponse>('POST', `/message/sendText/${instanceName}`, {
      number,
      text,
    });
    return res.key?.id ?? null;
  }

  async sendMedia(
    instanceName: string,
    params: { number: string; media: string; caption?: string; fileName?: string },
  ): Promise<string | null> {
    const res = await this.request<EvolutionSendResponse>('POST', `/message/sendMedia/${instanceName}`, {
      number: params.number,
      mediatype: 'image',
      media: params.media,
      caption: params.caption,
      fileName: params.fileName,
    });
    return res.key?.id ?? null;
  }

  async sendButtons(
    instanceName: string,
    params: {
      number: string;
      title: string;
      description?: string;
      footer?: string;
      buttons: Array<{ id: string; displayText: string }>;
    },
  ): Promise<string | null> {
    const res = await this.request<EvolutionSendResponse>('POST', `/message/sendButtons/${instanceName}`, {
      number: params.number,
      title: params.title,
      description: params.description,
      footer: params.footer,
      buttons: params.buttons.map((b) => ({
        type: 'reply',
        displayText: b.displayText,
        id: b.id,
      })),
    });
    return res.key?.id ?? null;
  }

  async sendList(
    instanceName: string,
    params: {
      number: string;
      title: string;
      description?: string;
      buttonText: string;
      footerText?: string;
      sections: Array<{
        title: string;
        rows: Array<{ title: string; description?: string; rowId: string }>;
      }>;
    },
  ): Promise<string | null> {
    const res = await this.request<EvolutionSendResponse>('POST', `/message/sendList/${instanceName}`, {
      number: params.number,
      title: params.title,
      description: params.description,
      buttonText: params.buttonText,
      footerText: params.footerText,
      sections: params.sections,
    });
    return res.key?.id ?? null;
  }
}
