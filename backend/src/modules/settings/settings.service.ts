import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Company, Role } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export interface CompanySettingsResponse {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  logo: string | null;
  website: string | null;
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

    if (dto.settings) {
      this.assertValidJson(dto.settings);
    }

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: dto,
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
      phone: company.phone,
      email: company.email,
      address: company.address,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      logo: company.logo,
      website: company.website,
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
