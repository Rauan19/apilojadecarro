import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const SELLER_USER_SELECT = {
  id: true,
  companyId: true,
  name: true,
  email: true,
  role: true,
  active: true,
  phone: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const SELLER_INCLUDE = {
  user: { select: SELLER_USER_SELECT },
} satisfies Prisma.SellerInclude;

export type SellerWithUser = Prisma.SellerGetPayload<{
  include: typeof SELLER_INCLUDE;
}>;

export interface FindSellersParams {
  companyId: string;
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSellerData {
  companyId: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  commission?: number;
  notes?: string;
  active?: boolean;
}

export interface UpdateSellerData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  commission?: number;
  notes?: string;
  active?: boolean;
}

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'commission',
  'active',
  'updatedAt',
] as const;

@Injectable()
export class SellersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSellerData): Promise<SellerWithUser> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          role: Role.SELLER,
          phone: data.phone,
          active: data.active ?? true,
          company: { connect: { id: data.companyId } },
        },
      });

      return tx.seller.create({
        data: {
          company: { connect: { id: data.companyId } },
          user: { connect: { id: user.id } },
          commission: data.commission ?? 0,
          notes: data.notes,
          active: data.active ?? true,
        },
        include: SELLER_INCLUDE,
      });
    });
  }

  async findById(
    id: string,
    companyId: string,
  ): Promise<SellerWithUser | null> {
    return this.prisma.seller.findFirst({
      where: { id, companyId },
      include: SELLER_INCLUDE,
    });
  }

  async findMany(
    params: FindSellersParams,
  ): Promise<{ items: SellerWithUser[]; total: number }> {
    const where = this.buildWhere(params.companyId, params.search);
    const sortBy = ALLOWED_SORT_FIELDS.includes(
      params.sortBy as (typeof ALLOWED_SORT_FIELDS)[number],
    )
      ? params.sortBy!
      : 'createdAt';

    const [items, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { [sortBy]: params.sortOrder ?? 'desc' },
        include: SELLER_INCLUDE,
      }),
      this.prisma.seller.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    userId: string,
    data: UpdateSellerData,
  ): Promise<SellerWithUser> {
    const { name, email, password, phone, commission, notes, active } = data;

    return this.prisma.$transaction(async (tx) => {
      const userUpdate: Prisma.UserUpdateInput = {};
      if (name !== undefined) userUpdate.name = name;
      if (email !== undefined) userUpdate.email = email;
      if (password !== undefined) userUpdate.password = password;
      if (phone !== undefined) userUpdate.phone = phone;
      if (active !== undefined) userUpdate.active = active;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({ where: { id: userId }, data: userUpdate });
      }

      const sellerUpdate: Prisma.SellerUpdateInput = {};
      if (commission !== undefined) sellerUpdate.commission = commission;
      if (notes !== undefined) sellerUpdate.notes = notes;
      if (active !== undefined) sellerUpdate.active = active;

      return tx.seller.update({
        where: { id },
        data: sellerUpdate,
        include: SELLER_INCLUDE,
      });
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.seller.delete({ where: { id } });
      await tx.user.delete({ where: { id: userId } });
    });
  }

  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return false;
    }

    return excludeUserId ? user.id !== excludeUserId : true;
  }

  private buildWhere(
    companyId: string,
    search?: string,
  ): Prisma.SellerWhereInput {
    const where: Prisma.SellerWhereInput = { companyId };

    if (search?.trim()) {
      const term = search.trim();
      where.user = {
        OR: [
          { name: { contains: term } },
          { email: { contains: term } },
          { phone: { contains: term } },
        ],
      };
    }

    return where;
  }
}
