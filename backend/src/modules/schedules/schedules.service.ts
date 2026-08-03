import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, Schedule } from '@prisma/client';
import {
  buildPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from '../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    pagination: PaginationDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<Schedule>> {
    const companyId = this.resolveCompanyId(user);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(companyId, pagination.search);

    const [items, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [pagination.sortBy ?? 'date']: pagination.sortOrder ?? 'desc' },
        include: {
          vehicle: {
            select: { id: true, brand: true, model: true, year: true },
          },
        },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<Schedule> {
    const companyId = this.resolveCompanyId(user);
    const schedule = await this.prisma.schedule.findFirst({
      where: { id, companyId },
      include: {
        vehicle: {
          select: { id: true, brand: true, model: true, year: true },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return schedule;
  }

  async update(
    id: string,
    dto: UpdateScheduleDto,
    user: AuthenticatedUser,
  ): Promise<Schedule> {
    await this.findOne(id, user);
    const companyId = this.resolveCompanyId(user);

    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { id: dto.vehicleId, companyId },
      });

      if (!vehicle) {
        throw new NotFoundException('Veículo não encontrado');
      }
    }

    return this.prisma.schedule.update({
      where: { id },
      data: dto,
      include: {
        vehicle: {
          select: { id: true, brand: true, model: true, year: true },
        },
      },
    });
  }

  private resolveCompanyId(user: AuthenticatedUser): string {
    if (user.role === Role.SUPER_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException(
          'SUPER_ADMIN deve estar vinculado a uma empresa para acessar agendamentos',
        );
      }
      return user.companyId;
    }

    if (!user.companyId) {
      throw new ForbiddenException('Usuário sem empresa vinculada');
    }

    return user.companyId;
  }

  private buildWhere(
    companyId: string,
    search?: string,
  ): Prisma.ScheduleWhereInput {
    const where: Prisma.ScheduleWhereInput = { companyId };

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { phone: { contains: term } },
        { email: { contains: term } },
        { notes: { contains: term } },
      ];
    }

    return where;
  }
}
