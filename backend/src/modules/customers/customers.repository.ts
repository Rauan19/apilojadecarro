import { Injectable } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface FindCustomersParams {
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
  'email',
  'phone',
  'city',
  'updatedAt',
] as const;

const CUSTOMER_INCLUDE = {
  seller: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.CustomerInclude;

export type CustomerWithSeller = Prisma.CustomerGetPayload<{
  include: typeof CUSTOMER_INCLUDE;
}>;

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CustomerCreateInput): Promise<CustomerWithSeller> {
    return this.prisma.customer.create({
      data,
      include: CUSTOMER_INCLUDE,
    });
  }

  async findById(
    id: string,
    companyId: string,
    sellerId?: string,
  ): Promise<CustomerWithSeller | null> {
    return this.prisma.customer.findFirst({
      where: {
        id,
        companyId,
        ...(sellerId ? { sellerId } : {}),
      },
      include: CUSTOMER_INCLUDE,
    });
  }

  async findMany(
    params: FindCustomersParams,
  ): Promise<{ items: CustomerWithSeller[]; total: number }> {
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
      this.prisma.customer.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { [sortBy]: params.sortOrder ?? 'desc' },
        include: CUSTOMER_INCLUDE,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    data: Prisma.CustomerUpdateInput,
  ): Promise<CustomerWithSeller> {
    return this.prisma.customer.update({
      where: { id },
      data,
      include: CUSTOMER_INCLUDE,
    });
  }

  async delete(id: string): Promise<Customer> {
    return this.prisma.customer.delete({ where: { id } });
  }

  private buildWhere(
    companyId: string,
    sellerId?: string,
    search?: string,
  ): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = { companyId };

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
        { city: { contains: term } },
      ];
    }

    return where;
  }
}
