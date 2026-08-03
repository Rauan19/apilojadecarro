import { Injectable } from '@nestjs/common';
import { Prisma, Proposal } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface FindProposalsParams {
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
  'value',
  'status',
  'updatedAt',
] as const;

const PROPOSAL_INCLUDE = {
  seller: { select: { id: true, name: true, email: true } },
  customer: { select: { id: true, name: true, email: true, phone: true } },
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      price: true,
      status: true,
    },
  },
} satisfies Prisma.ProposalInclude;

export type ProposalWithRelations = Prisma.ProposalGetPayload<{
  include: typeof PROPOSAL_INCLUDE;
}>;

@Injectable()
export class ProposalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProposalCreateInput): Promise<ProposalWithRelations> {
    return this.prisma.proposal.create({
      data,
      include: PROPOSAL_INCLUDE,
    });
  }

  async findById(
    id: string,
    companyId: string,
    sellerId?: string,
  ): Promise<ProposalWithRelations | null> {
    return this.prisma.proposal.findFirst({
      where: {
        id,
        companyId,
        ...(sellerId ? { sellerId } : {}),
      },
      include: PROPOSAL_INCLUDE,
    });
  }

  async findMany(
    params: FindProposalsParams,
  ): Promise<{ items: ProposalWithRelations[]; total: number }> {
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
      this.prisma.proposal.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { [sortBy]: params.sortOrder ?? 'desc' },
        include: PROPOSAL_INCLUDE,
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    data: Prisma.ProposalUpdateInput,
  ): Promise<ProposalWithRelations> {
    return this.prisma.proposal.update({
      where: { id },
      data,
      include: PROPOSAL_INCLUDE,
    });
  }

  async delete(id: string): Promise<Proposal> {
    return this.prisma.proposal.delete({ where: { id } });
  }

  private buildWhere(
    companyId: string,
    sellerId?: string,
    search?: string,
  ): Prisma.ProposalWhereInput {
    const where: Prisma.ProposalWhereInput = { companyId };

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { notes: { contains: term } },
        { customer: { name: { contains: term } } },
        { vehicle: { brand: { contains: term } } },
        { vehicle: { model: { contains: term } } },
      ];
    }

    return where;
  }
}
