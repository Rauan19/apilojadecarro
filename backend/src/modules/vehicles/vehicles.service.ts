import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VehicleImage } from '@prisma/client';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { resolveTenantCompanyId } from '../../common/utils/tenant.util';
import { LocalUploadProvider } from '../uploads/local-upload.provider';
import { UploadsService } from '../uploads/uploads.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesQueryDto } from './dto/vehicles-query.dto';
import {
  PlateLookupResult,
  PlateLookupService,
} from './plate-lookup.service';
import {
  VehicleWithImages,
  VehiclesRepository,
} from './vehicles.repository';

export const MAX_VEHICLE_IMAGES = 5;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly uploadsService: UploadsService,
    private readonly uploadProvider: LocalUploadProvider,
    private readonly plateLookupService: PlateLookupService,
  ) {}

  async lookupPlate(plate: string): Promise<PlateLookupResult> {
    return this.plateLookupService.lookup(plate);
  }

  async create(
    dto: CreateVehicleDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<VehicleWithImages> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);

    return this.vehiclesRepository.create({
      type: dto.type,
      brand: dto.brand,
      model: dto.model,
      version: dto.version,
      year: dto.year,
      yearModel: dto.yearModel,
      price: dto.price,
      originalPrice: dto.originalPrice ?? null,
      purchasePrice: dto.purchasePrice ?? null,
      soldPrice: dto.soldPrice ?? null,
      mileage: dto.mileage,
      plate: dto.plate,
      renavam: dto.renavam,
      fuel: dto.fuel,
      transmission: dto.transmission,
      color: dto.color,
      doors: dto.doors,
      description: dto.description,
      optionals: this.serializeOptionals(dto.optionals),
      status: dto.status,
      notes: dto.notes,
      company: { connect: { id: companyId } },
      createdBy: { connect: { id: actor.id } },
    });
  }

  async findAll(
    pagination: VehiclesQueryDto,
    actor: AuthenticatedUser,
  ): Promise<PaginatedResult<VehicleWithImages>> {
    const companyId = resolveTenantCompanyId(actor, pagination.companyId);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.vehiclesRepository.findMany({
      companyId,
      skip,
      take: limit,
      search: pagination.search,
      type: pagination.type,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    });

    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(
    id: string,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<VehicleWithImages> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);
    const vehicle = await this.vehiclesRepository.findById(id, companyId);

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    return vehicle;
  }

  async update(
    id: string,
    dto: UpdateVehicleDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<VehicleWithImages> {
    await this.findOne(id, actor, queryCompanyId);
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);

    const { optionals, ...rest } = dto;

    return this.vehiclesRepository.update(id, companyId, {
      ...rest,
      ...(optionals !== undefined
        ? { optionals: this.serializeOptionals(optionals) }
        : {}),
    });
  }

  async remove(
    id: string,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<VehicleWithImages> {
    const vehicle = await this.findOne(id, actor, queryCompanyId);
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);

    for (const image of vehicle.images) {
      await this.uploadProvider.delete(this.extractRelativePath(image.url));
    }

    return this.vehiclesRepository.delete(id, companyId);
  }

  async addImages(
    id: string,
    files: Express.Multer.File[],
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<VehicleImage[]> {
    await this.findOne(id, actor, queryCompanyId);
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);

    if (!files?.length) {
      throw new BadRequestException('Nenhuma imagem enviada');
    }

    const currentCount = await this.vehiclesRepository.countImages(id);
    const remaining = MAX_VEHICLE_IMAGES - currentCount;

    if (remaining <= 0) {
      throw new BadRequestException(
        `Máximo de ${MAX_VEHICLE_IMAGES} fotos por veículo`,
      );
    }

    if (files.length > remaining) {
      throw new BadRequestException(
        `Você pode adicionar no máximo mais ${remaining} foto(s). Limite: ${MAX_VEHICLE_IMAGES}.`,
      );
    }

    const uploads = await this.uploadsService.uploadMany(files, companyId);

    return this.vehiclesRepository.createImages(
      id,
      companyId,
      uploads.map((upload) => upload.url),
      currentCount,
    );
  }

  async removeImage(
    vehicleId: string,
    imageId: string,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<VehicleImage> {
    await this.findOne(vehicleId, actor, queryCompanyId);
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);

    const image = await this.vehiclesRepository.findImage(
      imageId,
      vehicleId,
      companyId,
    );

    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    await this.uploadProvider.delete(this.extractRelativePath(image.url));
    return this.vehiclesRepository.deleteImage(imageId);
  }

  private extractRelativePath(storedUrl: string): string {
    if (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) {
      const url = new URL(storedUrl);
      return url.pathname.replace(/^\//, '');
    }
    return storedUrl;
  }

  private serializeOptionals(optionals?: string | string[]): string | undefined {
    if (optionals === undefined || optionals === null) {
      return undefined;
    }

    if (Array.isArray(optionals)) {
      return JSON.stringify(optionals);
    }

    try {
      JSON.parse(optionals);
      return optionals;
    } catch {
      return JSON.stringify([optionals]);
    }
  }
}
