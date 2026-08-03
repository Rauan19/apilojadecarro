import { Injectable } from '@nestjs/common';
import { Company, CompanyStatus, Prisma, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type CompanyWithPlan = Company & {
  plan: SubscriptionPlan | null;
};

export interface FindCompaniesParams {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PlanBillingRow {
  planId: string;
  name: string;
  priceMonthly: number;
  count: number;
  mrr: number;
}

export interface CompanyStatsOverview {
  total: number;
  byStatus: Record<CompanyStatus, number>;
  activeSubscriptions: number;
  mrr: number;
  byPlan: PlanBillingRow[];
}

const COMPANY_INCLUDE = {
  plan: true,
} satisfies Prisma.CompanyInclude;

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'name',
  'email',
  'status',
  'updatedAt',
] as const;

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CompanyCreateInput): Promise<CompanyWithPlan> {
    return this.prisma.company.create({ data, include: COMPANY_INCLUDE });
  }

  async findById(id: string): Promise<CompanyWithPlan | null> {
    return this.prisma.company.findUnique({
      where: { id },
      include: COMPANY_INCLUDE,
    });
  }

  async findBySlug(slug: string): Promise<CompanyWithPlan | null> {
    return this.prisma.company.findUnique({
      where: { slug },
      include: COMPANY_INCLUDE,
    });
  }

  async findMany(
    params: FindCompaniesParams,
  ): Promise<{ items: CompanyWithPlan[]; total: number }> {
    const where = this.buildWhere(params.search);
    const sortBy = ALLOWED_SORT_FIELDS.includes(
      params.sortBy as (typeof ALLOWED_SORT_FIELDS)[number],
    )
      ? params.sortBy!
      : 'createdAt';

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { [sortBy]: params.sortOrder ?? 'desc' },
        include: COMPANY_INCLUDE,
      }),
      this.prisma.company.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    data: Prisma.CompanyUpdateInput,
  ): Promise<CompanyWithPlan> {
    return this.prisma.company.update({
      where: { id },
      data,
      include: COMPANY_INCLUDE,
    });
  }

  async delete(id: string): Promise<CompanyWithPlan> {
    return this.prisma.company.delete({
      where: { id },
      include: COMPANY_INCLUDE,
    });
  }

  async getStatsOverview(): Promise<CompanyStatsOverview> {
    const [total, statusGroups, companies] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.company.findMany({
        where: { planId: { not: null } },
        select: {
          planId: true,
          plan: { select: { id: true, name: true, priceMonthly: true } },
        },
      }),
    ]);

    const byStatus = Object.values(CompanyStatus).reduce(
      (acc, status) => {
        acc[status] =
          statusGroups.find((group) => group.status === status)?._count
            .status ?? 0;
        return acc;
      },
      {} as Record<CompanyStatus, number>,
    );

    const planMap = new Map<string, PlanBillingRow>();
    for (const company of companies) {
      if (!company.plan || !company.planId) continue;
      const current = planMap.get(company.planId);
      if (current) {
        current.count += 1;
        current.mrr += company.plan.priceMonthly;
      } else {
        planMap.set(company.planId, {
          planId: company.planId,
          name: company.plan.name,
          priceMonthly: company.plan.priceMonthly,
          count: 1,
          mrr: company.plan.priceMonthly,
        });
      }
    }

    const byPlan = Array.from(planMap.values()).sort(
      (a, b) => b.mrr - a.mrr,
    );
    const mrr = byPlan.reduce((sum, row) => sum + row.mrr, 0);

    return {
      total,
      byStatus,
      activeSubscriptions: companies.length,
      mrr,
      byPlan,
    };
  }

  private buildWhere(search?: string): Prisma.CompanyWhereInput {
    if (!search?.trim()) {
      return {};
    }

    const term = search.trim();
    return {
      OR: [
        { name: { contains: term } },
        { email: { contains: term } },
        { slug: { contains: term } },
        { document: { contains: term } },
      ],
    };
  }
}
