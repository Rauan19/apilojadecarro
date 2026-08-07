import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Company, Role } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { isValidCpfOrCnpj } from '../../common/utils/document.util';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export interface CompanySettingsResponse {
  id: string;
  name: string;
  slug: string;
  document: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  logo: string | null;
  website: string | null;
  customDomain: string | null;
  settings: Record<string, unknown> | null;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): Promise<CompanySettingsResponse> {
    const companyId = this.resolveCompanyId(user, companyIdParam);
    const company = await this.findCompany(companyId);
    return this.toSettingsResponse(company);
  }

  async updateSettings(
    user: AuthenticatedUser,
    dto: UpdateSettingsDto,
    companyIdParam?: string,
  ): Promise<CompanySettingsResponse> {
    const companyId = this.resolveCompanyId(user, companyIdParam);
    const existing = await this.findCompany(companyId);

    const data: Record<string, unknown> = { ...dto };

    if (dto.document !== undefined) {
      const document = dto.document.trim();
      // Documento inválido só apareceria lá na frente, recusado pelo Mercado
      // Pago na hora de assinar. Melhor barrar já no cadastro.
      if (document && !isValidCpfOrCnpj(document)) {
        throw new BadRequestException('CPF ou CNPJ inválido');
      }
      data.document = document || null;
    }

    if (dto.customDomain !== undefined) {
      data.customDomain = this.normalizeDomain(dto.customDomain);
      if (data.customDomain) {
        const taken = await this.prisma.company.findFirst({
          where: {
            customDomain: data.customDomain as string,
            NOT: { id: companyId },
          },
        });
        if (taken) {
          throw new ConflictException('Este domínio já está em uso por outra loja');
        }
      }
    }

    if (dto.settings) {
      this.assertValidJson(dto.settings);
      data.settings = this.mergeSettingsJson(existing.settings, dto.settings);
    }

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data,
    });

    return this.toSettingsResponse(company);
  }

  private resolveCompanyId(
    user: AuthenticatedUser,
    companyIdParam?: string,
  ): string {
    if (user.role === Role.SUPER_ADMIN) {
      const targetId = companyIdParam ?? user.companyId;
      if (!targetId) {
        throw new BadRequestException(
          'Informe companyId para gerenciar configurações de uma empresa',
        );
      }
      return targetId;
    }

    if (!user.companyId) {
      throw new ForbiddenException('Usuário sem empresa vinculada');
    }

    if (companyIdParam && companyIdParam !== user.companyId) {
      throw new ForbiddenException(
        'Acesso permitido apenas para a sua empresa',
      );
    }

    return user.companyId;
  }

  private async findCompany(id: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({ where: { id } });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }

  private toSettingsResponse(company: Company): CompanySettingsResponse {
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      document: company.document,
      phone: company.phone,
      email: company.email,
      address: company.address,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      logo: company.logo,
      website: company.website,
      customDomain: company.customDomain,
      settings: this.parseSettings(company.settings),
    };
  }

  private parseSettings(
    settings: string | null,
  ): Record<string, unknown> | null {
    if (!settings) {
      return null;
    }

    try {
      return JSON.parse(settings) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private mergeSettingsJson(
    currentRaw: string | null,
    incomingRaw: string,
  ): string {
    const current = this.parseSettings(currentRaw) ?? {};
    const incoming = JSON.parse(incomingRaw) as Record<string, unknown>;

    const currentTheme =
      typeof current.theme === 'object' && current.theme !== null
        ? (current.theme as Record<string, unknown>)
        : {};
    const incomingTheme =
      typeof incoming.theme === 'object' && incoming.theme !== null
        ? (incoming.theme as Record<string, unknown>)
        : {};

    const currentSocial =
      typeof current.social === 'object' && current.social !== null
        ? (current.social as Record<string, unknown>)
        : {};
    const incomingSocial =
      typeof incoming.social === 'object' && incoming.social !== null
        ? (incoming.social as Record<string, unknown>)
        : {};

    return JSON.stringify({
      ...current,
      ...incoming,
      theme: { ...currentTheme, ...incomingTheme },
      social: { ...currentSocial, ...incomingSocial },
      banners: Array.isArray(incoming.banners)
        ? incoming.banners
        : Array.isArray(current.banners)
          ? current.banners
          : [],
    });
  }

  private normalizeDomain(value: string | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }
    return trimmed
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '')
      .replace(/^www\./, '');
  }

  private assertValidJson(value: string): void {
    try {
      JSON.parse(value);
    } catch {
      throw new BadRequestException(
        'O campo settings deve conter um JSON válido',
      );
    }
  }
}
