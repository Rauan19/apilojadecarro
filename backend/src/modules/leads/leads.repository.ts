import { Injectable } from '@nestjs/common';
import { Lead, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface FindLeadsParams {
  companyId: string;
  sellerId?: string;
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'name',
  'status',
  'origin',
  'updatedAt',
] as const;

const LEAD_INCLUDE = {
  seller: { select: { id: true, name: true, email: true } },
  customer: { select: { id: true, name: true, email: true, phone: true } },
  vehicle: {
    select: { id: true, brand: true, model: true, year: true, price: true },
  },
} satisfies Prisma.LeadInclude;

export type LeadWithRelations = Prisma.LeadGetPayload<{
  include: typeof LEAD_INCLUDE;
}>;

@Injectable()
export class LeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LeadCreateInput): Promise<LeadWithRelations> {
    return this.prisma.lead.create({
      data,
      include: LEAD_INCLUDE,
    });
  }

  async findById(
    id: string,
    companyId: string,
    sellerId?: string,
  ): Promise<LeadWithRelations | null> {
    return this.prisma.lead.findFirst({
      where: {
        id,
        companyId,
        ...(sellerId ? { sellerId } : {}),
      },
      include: LEAD_INCLUDE,
    });
  }

  async findMany(
    params: FindLeadsParams,
  ): Promise<{ items: LeadWithRelations[]; total: number }> {
    const where = this.buildWhere(
      params.companyId,
      params.sellerId,
      params.search,
    );
    const sortBy = ALLOWED_SORT_FIELDS.includes(
      params.sortBy as (typeof ALLOWED_SORT_FIELDS)[number],
    )
      ? params.sortBy!
      : 'createdAt';

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { [sortBy]: params.sortOrder ?? 'desc' },
        include: LEAD_INCLUDE,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    data: Prisma.LeadUpdateInput,
  ): Promise<LeadWithRelations> {
    return this.prisma.lead.update({
      where: { id },
      data,
      include: LEAD_INCLUDE,
    });
  }

  async delete(id: string): Promise<Lead> {
    return this.prisma.lead.delete({ where: { id } });
  }

  private buildWhere(
    companyId: string,
    sellerId?: string,
    search?: string,
  ): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = { companyId };

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
      ];
    }

    return where;
  }
}
