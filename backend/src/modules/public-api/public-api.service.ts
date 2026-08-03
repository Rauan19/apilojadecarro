import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
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

@Injectable()
export class PublicApiService {
  constructor(private readonly prisma: PrismaService) {}

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
        include: {
          images: { orderBy: { order: 'asc' } },
        },
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
      include: {
        images: { orderBy: { order: 'asc' } },
      },
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
        notes: dto.notes,
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
        logo: true,
        phone: true,
        email: true,
        city: true,
        settings: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return {
      name: company.name,
      logo: company.logo,
      phone: company.phone,
      email: company.email,
      city: company.city,
      settings: this.parseSettings(company.settings),
    };
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

    if (filters.brand) {
      where.brand = { contains: filters.brand };
    }

    if (filters.model) {
      where.model = { contains: filters.model };
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
      where.color = { contains: filters.color };
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { brand: { contains: term } },
        { model: { contains: term } },
        { version: { contains: term } },
        { description: { contains: term } },
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
}
