import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const USER_PUBLIC_SELECT = {
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
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.UserSelect;

export type UserPublic = Prisma.UserGetPayload<{
  select: typeof USER_PUBLIC_SELECT;
}>;

export interface FindUsersParams {
  skip: number;
  take: number;
  companyId?: string;
  role?: Role;
  active?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'name',
  'email',
  'role',
  'active',
  'updatedAt',
] as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<UserPublic> {
    return this.prisma.user.create({
      data,
      select: USER_PUBLIC_SELECT,
    });
  }

  async findById(id: string): Promise<UserPublic | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
  }

  async findByEmail(email: string): Promise<UserPublic | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_PUBLIC_SELECT,
    });
  }

  async findMany(
    params: FindUsersParams,
  ): Promise<{ items: UserPublic[]; total: number }> {
    const where = this.buildWhere(params);
    const sortBy = ALLOWED_SORT_FIELDS.includes(
      params.sortBy as (typeof ALLOWED_SORT_FIELDS)[number],
    )
      ? params.sortBy!
      : 'createdAt';

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { [sortBy]: params.sortOrder ?? 'desc' },
        select: USER_PUBLIC_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<UserPublic> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_PUBLIC_SELECT,
    });
  }

  async delete(id: string): Promise<UserPublic> {
    return this.prisma.user.delete({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return false;
    }

    return excludeId ? user.id !== excludeId : true;
  }

  private buildWhere(params: FindUsersParams): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (params.companyId) {
      where.companyId = params.companyId;
    }

    if (params.role) {
      where.role = params.role;
    }

    if (params.active !== undefined) {
      where.active = params.active;
    }

    if (params.search?.trim()) {
      const term = params.search.trim();
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
      ];
    }

    return where;
  }
}
