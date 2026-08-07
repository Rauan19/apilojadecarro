import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CompanyStatus,
  LeadOrigin,
  Prisma,
  ScheduleStatus,
  VehicleStatus,
} from '@prisma/client';
import {
  buildPaginatedResult,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { CreatePublicScheduleDto } from './dto/create-public-schedule.dto';
import { PublicVehicleFilterDto } from './dto/public-vehicle-filter.dto';

const INTEREST_LABELS: Record<string, string> = {
  INTEREST: 'Tenho interesse',
  FINANCING: 'Simular financiamento',
  CASH: 'Pagamento à vista',
  TRADE_IN: 'Avaliar troca',
  VISIT: 'Agendar visita',
};

@Injectable()
export class PublicApiService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly publicVehicleSelect = {
    id: true,
    type: true,
    brand: true,
    model: true,
    version: true,
    year: true,
    yearModel: true,
    price: true,
    originalPrice: true,
    mileage: true,
    fuel: true,
    transmission: true,
    color: true,
    doors: true,
    description: true,
    optionals: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    images: { orderBy: { order: 'asc' as const } },
  };

  async findVehicles(
    companyId: string | null,
    filters: PublicVehicleFilterDto,
  ) {
    this.requireCompanyId(companyId);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildVehicleWhere(companyId!, filters);

    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [filters.sortBy ?? 'createdAt']: filters.sortOrder ?? 'desc' },
        select: this.publicVehicleSelect,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findVehicleById(companyId: string | null, id: string) {
    this.requireCompanyId(companyId);

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        companyId: companyId!,
        status: VehicleStatus.AVAILABLE,
      },
      select: this.publicVehicleSelect,
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    return vehicle;
  }

  async createLead(companyId: string | null, dto: CreatePublicLeadDto) {
    this.requireCompanyId(companyId);

    if (dto.vehicleId) {
      await this.assertVehicleBelongsToCompany(companyId!, dto.vehicleId);
    }

    return this.prisma.lead.create({
      data: {
        companyId: companyId!,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        notes: this.buildLeadNotes(dto),
        vehicleId: dto.vehicleId,
        origin: LeadOrigin.SITE,
      },
    });
  }

  async createSchedule(
    companyId: string | null,
    dto: CreatePublicScheduleDto,
  ) {
    this.requireCompanyId(companyId);

    if (dto.vehicleId) {
      await this.assertVehicleBelongsToCompany(companyId!, dto.vehicleId);
    }

    return this.prisma.schedule.create({
      data: {
        companyId: companyId!,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        date: dto.date,
        notes: dto.notes,
        vehicleId: dto.vehicleId,
        status: ScheduleStatus.PENDING,
      },
    });
  }

  async getCompanyInfo(companyId: string | null) {
    this.requireCompanyId(companyId);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId! },
      select: {
        name: true,
        slug: true,
        logo: true,
        phone: true,
        email: true,
        city: true,
        customDomain: true,
        settings: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return {
      name: company.name,
      slug: company.slug,
      logo: company.logo,
      phone: company.phone,
      email: company.email,
      city: company.city,
      customDomain: company.customDomain,
      settings: this.parseSettings(company.settings),
    };
  }

  async resolveActiveCompanyIdBySlug(slug: string): Promise<string> {
    const company = await this.prisma.company.findFirst({
      where: { slug, status: CompanyStatus.ACTIVE },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Loja não encontrada');
    }

    return company.id;
  }

  async resolveByHost(host: string) {
    const normalized = this.normalizeHost(host);
    if (!normalized) {
      throw new NotFoundException('Domínio inválido');
    }

    const companies = await this.prisma.company.findMany({
      where: {
        status: CompanyStatus.ACTIVE,
        customDomain: { not: null },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        customDomain: true,
      },
    });

    const match = companies.find(
      (c) => c.customDomain && this.normalizeHost(c.customDomain) === normalized,
    );

    if (!match) {
      throw new NotFoundException('Nenhuma loja encontrada para este domínio');
    }

    return {
      id: match.id,
      slug: match.slug,
      name: match.name,
      customDomain: match.customDomain,
    };
  }

  normalizeHost(host: string): string {
    return host
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '')
      .replace(/^www\./, '');
  }

  private requireCompanyId(companyId: string | null): asserts companyId is string {
    if (!companyId) {
      throw new UnauthorizedException(
        'Token de API inválido ou contexto de empresa ausente',
      );
    }
  }

  private buildVehicleWhere(
    companyId: string,
    filters: PublicVehicleFilterDto,
  ): Prisma.VehicleWhereInput {
    const where: Prisma.VehicleWhereInput = {
      companyId,
      status: VehicleStatus.AVAILABLE,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.brand) {
      where.brand = { contains: filters.brand, mode: 'insensitive' };
    }

    if (filters.model) {
      where.model = { contains: filters.model, mode: 'insensitive' };
    }

    if (filters.year) {
      where.year = filters.year;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.transmission) {
      where.transmission = filters.transmission;
    }

    if (filters.fuel) {
      where.fuel = filters.fuel;
    }

    if (filters.color) {
      where.color = { contains: filters.color, mode: 'insensitive' };
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { brand: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
        { version: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async assertVehicleBelongsToCompany(
    companyId: string,
    vehicleId: string,
  ): Promise<void> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }
  }

  private parseSettings(settings: string | null): Record<string, unknown> | null {
    if (!settings) {
      return null;
    }

    try {
      return JSON.parse(settings) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private buildLeadNotes(dto: CreatePublicLeadDto): string | undefined {
    const parts: string[] = [];
    if (dto.interestType) {
      parts.push(
        `Tipo: ${INTEREST_LABELS[dto.interestType] ?? dto.interestType}`,
      );
    }
    if (dto.notes?.trim()) {
      parts.push(dto.notes.trim());
    }
    return parts.length ? parts.join('\n') : undefined;
  }
}
