import { Injectable } from '@nestjs/common';
import { ApiLog, Prisma } from '@prisma/client';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiLogsFilterDto } from './dto/api-logs-filter.dto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findApiLogs(
    filters: ApiLogsFilterDto,
  ): Promise<PaginatedResult<ApiLog>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);

    const [items, total] = await Promise.all([
      this.prisma.apiLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [filters.sortBy ?? 'createdAt']: filters.sortOrder ?? 'desc' },
      }),
      this.prisma.apiLog.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  private buildWhere(filters: ApiLogsFilterDto): Prisma.ApiLogWhereInput {
    const where: Prisma.ApiLogWhereInput = {};

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.endpoint?.trim()) {
      where.endpoint = { contains: filters.endpoint.trim() };
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { endpoint: { contains: term } },
        { method: { contains: term } },
        { ip: { contains: term } },
        { userAgent: { contains: term } },
      ];
    }

    return where;
  }
}
