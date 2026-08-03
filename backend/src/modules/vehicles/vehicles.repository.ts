import { Injectable } from '@nestjs/common';
import { Prisma, Vehicle, VehicleImage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type VehicleWithImages = Vehicle & { images: VehicleImage[] };

export interface FindVehiclesParams {
  companyId: string;
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'brand',
  'model',
  'year',
  'price',
  'status',
  'updatedAt',
] as const;

const VEHICLE_INCLUDE = {
  images: { orderBy: { order: 'asc' as const } },
} satisfies Prisma.VehicleInclude;

@Injectable()
export class VehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.VehicleCreateInput): Promise<VehicleWithImages> {
    return this.prisma.vehicle.create({
      data,
      include: VEHICLE_INCLUDE,
    });
  }

  async findById(
    id: string,
    companyId: string,
  ): Promise<VehicleWithImages | null> {
    return this.prisma.vehicle.findFirst({
      where: { id, companyId },
      include: VEHICLE_INCLUDE,
    });
  }

  async findMany(
    params: FindVehiclesParams,
  ): Promise<{ items: VehicleWithImages[]; total: number }> {
    const where = this.buildWhere(params.companyId, params.search);
    const sortBy = ALLOWED_SORT_FIELDS.includes(
      params.sortBy as (typeof ALLOWED_SORT_FIELDS)[number],
    )
      ? params.sortBy!
      : 'createdAt';

    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { [sortBy]: params.sortOrder ?? 'desc' },
        include: VEHICLE_INCLUDE,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    companyId: string,
    data: Prisma.VehicleUpdateInput,
  ): Promise<VehicleWithImages> {
    await this.findById(id, companyId);

    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: VEHICLE_INCLUDE,
    });
  }

  async delete(id: string, companyId: string): Promise<VehicleWithImages> {
    await this.findById(id, companyId);

    return this.prisma.vehicle.delete({
      where: { id },
      include: VEHICLE_INCLUDE,
    });
  }

  async createImages(
    vehicleId: string,
    companyId: string,
    urls: string[],
    startOrder: number,
  ): Promise<VehicleImage[]> {
    return this.prisma.$transaction(
      urls.map((url, index) =>
        this.prisma.vehicleImage.create({
          data: {
            vehicleId,
            companyId,
            url,
            order: startOrder + index,
          },
        }),
      ),
    );
  }

  async findImage(
    imageId: string,
    vehicleId: string,
    companyId: string,
  ): Promise<VehicleImage | null> {
    return this.prisma.vehicleImage.findFirst({
      where: { id: imageId, vehicleId, companyId },
    });
  }

  async deleteImage(imageId: string): Promise<VehicleImage> {
    return this.prisma.vehicleImage.delete({ where: { id: imageId } });
  }

  async countImages(vehicleId: string): Promise<number> {
    return this.prisma.vehicleImage.count({ where: { vehicleId } });
  }

  private buildWhere(
    companyId: string,
    search?: string,
  ): Prisma.VehicleWhereInput {
    const where: Prisma.VehicleWhereInput = { companyId };

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { brand: { contains: term } },
        { model: { contains: term } },
        { version: { contains: term } },
        { plate: { contains: term } },
        { color: { contains: term } },
      ];
    }

    return where;
  }
}
