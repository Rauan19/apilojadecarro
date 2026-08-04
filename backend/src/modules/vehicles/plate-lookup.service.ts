import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FuelType, Transmission } from '@prisma/client';

export interface PlateLookupResult {
  plate: string;
  brand: string;
  model: string;
  version?: string;
  year?: number;
  yearModel?: number;
  color?: string;
  fuel?: FuelType;
  transmission?: Transmission;
  doors?: number;
  fipePrice?: number;
  source: 'api' | 'demo';
  message?: string;
}

@Injectable()
export class PlateLookupService {
  private readonly logger = new Logger(PlateLookupService.name);

  constructor(private readonly config: ConfigService) {}

  async lookup(rawPlate: string): Promise<PlateLookupResult> {
    const plate = this.normalizePlate(rawPlate);
    if (!this.isValidPlate(plate)) {
      throw new BadRequestException(
        'Placa inválida. Use a antiga (ABC-1234 / ABC1234) ou Mercosul (ABC1D23).',
      );
    }

    const candidates = this.plateLookupCandidates(plate);
    const token = this.config.get<string>('PLATE_API_TOKEN')?.trim();

    if (token) {
      for (const candidate of candidates) {
        try {
          const result = await this.lookupInvertexto(candidate, token);
          if (result) {
            return { ...result, plate };
          }
        } catch (error) {
          this.logger.warn(
            `Falha na consulta de placa ${candidate}: ${(error as Error).message}`,
          );
        }
      }
    }

    const allowDemo =
      this.config.get<string>('PLATE_LOOKUP_DEMO') === 'true' ||
      this.config.get<string>('NODE_ENV') !== 'production';

    if (allowDemo) {
      return this.demoLookup(plate);
    }

    throw new ServiceUnavailableException(
      'Consulta por placa não configurada. Defina PLATE_API_TOKEN (Invertexto) no .env do backend.',
    );
  }

  private async lookupInvertexto(
    plate: string,
    token: string,
  ): Promise<PlateLookupResult | null> {
    const url = `https://api.invertexto.com/v1/placa/${encodeURIComponent(plate)}?token=${encodeURIComponent(token)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.warn(`Invertexto ${response.status}: ${body.slice(0, 200)}`);
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const marcaModelo = String(data.marca ?? data.marcaModelo ?? '');
    const { brand, model, version } = this.splitBrandModel(
      marcaModelo || String(data.modelo ?? ''),
      String(data.modelo ?? ''),
    );

    if (!brand && !model) {
      return null;
    }

    return {
      plate,
      brand: brand || 'Não identificado',
      model: model || 'Não identificado',
      version: version || undefined,
      year: this.toYear(data.ano ?? data.anoFabricacao),
      yearModel: this.toYear(data.anoModelo ?? data.ano_modelo),
      color: data.cor ? String(data.cor) : undefined,
      fuel: this.mapFuel(String(data.combustivel ?? data.combustivelTipo ?? '')),
      transmission: undefined,
      doors: undefined,
      source: 'api',
    };
  }

  private demoLookup(plate: string): PlateLookupResult {
    const samples: Omit<PlateLookupResult, 'plate' | 'source' | 'message'>[] = [
      {
        brand: 'Toyota',
        model: 'Corolla',
        version: 'XEi 2.0',
        year: 2021,
        yearModel: 2022,
        color: 'Prata',
        fuel: FuelType.FLEX,
        transmission: Transmission.AUTOMATIC,
        doors: 4,
        fipePrice: 118900,
      },
      {
        brand: 'Volkswagen',
        model: 'Golf',
        version: '1.4 TSI Highline',
        year: 2018,
        yearModel: 2019,
        color: 'Branco',
        fuel: FuelType.FLEX,
        transmission: Transmission.AUTOMATIC,
        doors: 4,
        fipePrice: 89900,
      },
      {
        brand: 'Honda',
        model: 'Civic',
        version: 'EXL 2.0',
        year: 2020,
        yearModel: 2020,
        color: 'Preto',
        fuel: FuelType.FLEX,
        transmission: Transmission.CVT,
        doors: 4,
        fipePrice: 112500,
      },
      {
        brand: 'Fiat',
        model: 'Argo',
        version: 'Drive 1.0',
        year: 2022,
        yearModel: 2023,
        color: 'Vermelho',
        fuel: FuelType.FLEX,
        transmission: Transmission.MANUAL,
        doors: 4,
        fipePrice: 68900,
      },
      {
        brand: 'Chevrolet',
        model: 'Onix',
        version: 'Premier 1.0 Turbo',
        year: 2023,
        yearModel: 2024,
        color: 'Cinza',
        fuel: FuelType.FLEX,
        transmission: Transmission.AUTOMATIC,
        doors: 4,
        fipePrice: 92900,
      },
    ];

    const index =
      [...plate].reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      samples.length;
    const sample = samples[index];

    return {
      ...sample,
      plate,
      source: 'demo',
      message:
        'Dados de demonstração. Configure PLATE_API_TOKEN (Invertexto) para consulta real por placa.',
    };
  }

  private normalizePlate(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
  }

  /** Cinza antiga: ABC1234 */
  private isOldPlate(plate: string): boolean {
    return /^[A-Z]{3}\d{4}$/.test(plate);
  }

  /** Mercosul: ABC1D23 */
  private isMercosulPlate(plate: string): boolean {
    return /^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate);
  }

  private isValidPlate(plate: string): boolean {
    return this.isOldPlate(plate) || this.isMercosulPlate(plate);
  }

  /** Tabela Denatran: 2º dígito da antiga ↔ letra Mercosul (0=A … 9=J) */
  private static readonly DIGIT_TO_LETTER = 'ABCDEFGHIJ';

  private oldToMercosul(plate: string): string | null {
    if (!this.isOldPlate(plate)) return null;
    const letter = PlateLookupService.DIGIT_TO_LETTER[Number(plate[4])];
    return `${plate.slice(0, 4)}${letter}${plate.slice(5)}`;
  }

  private mercosulToOld(plate: string): string | null {
    if (!this.isMercosulPlate(plate)) return null;
    const idx = PlateLookupService.DIGIT_TO_LETTER.indexOf(plate[4]);
    if (idx < 0) return null;
    return `${plate.slice(0, 4)}${idx}${plate.slice(5)}`;
  }

  /** Tenta a placa digitada e o equivalente no outro padrão (quando existir). */
  private plateLookupCandidates(plate: string): string[] {
    const alt = this.isOldPlate(plate)
      ? this.oldToMercosul(plate)
      : this.mercosulToOld(plate);
    return alt && alt !== plate ? [plate, alt] : [plate];
  }

  private splitBrandModel(
    marcaModelo: string,
    modeloFallback: string,
  ): { brand: string; model: string; version?: string } {
    const cleaned = marcaModelo.replace(/\s+/g, ' ').trim();
    if (cleaned.includes('/')) {
      const [brandPart, ...rest] = cleaned.split('/');
      const right = rest.join('/').trim();
      const parts = right.split(/\s+/);
      return {
        brand: this.titleCase(brandPart.trim()),
        model: this.titleCase(parts[0] ?? modeloFallback),
        version: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
      };
    }

    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return {
        brand: this.titleCase(parts[0]),
        model: this.titleCase(parts[1]),
        version: parts.length > 2 ? parts.slice(2).join(' ') : undefined,
      };
    }

    return {
      brand: this.titleCase(cleaned || 'Não identificado'),
      model: this.titleCase(modeloFallback || 'Não identificado'),
    };
  }

  private titleCase(value: string): string {
    return value
      .toLowerCase()
      .split(/\s+/)
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
      .join(' ');
  }

  private toYear(value: unknown): number | undefined {
    if (value == null || value === '') return undefined;
    const n = Number(String(value).replace(/\D/g, '').slice(0, 4));
    if (!Number.isFinite(n) || n < 1900 || n > 2100) return undefined;
    return n;
  }

  private mapFuel(raw: string): FuelType | undefined {
    const value = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    if (!value) return undefined;
    if (value.includes('DIESEL')) return FuelType.DIESEL;
    if (value.includes('ELETR')) return FuelType.ELECTRIC;
    if (value.includes('HIBR')) return FuelType.HYBRID;
    if (value.includes('GNV') || value.includes('GAS NATURAL')) return FuelType.GNV;
    if (value.includes('ETANOL') || value.includes('ALCOOL')) return FuelType.ETHANOL;
    if (value.includes('GASOLINA') && !value.includes('FLEX') && !value.includes('ALCOOL')) {
      return FuelType.GASOLINE;
    }
    if (value.includes('FLEX') || value.includes('GASOHOL') || value.includes('ALCOOL/GASOLINA')) {
      return FuelType.FLEX;
    }
    return FuelType.FLEX;
  }
}
