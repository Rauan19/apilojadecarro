import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CompanyPaginationDto } from '../../common/dto/company-pagination.dto';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { resolveTenantCompanyId } from '../../common/utils/tenant.util';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { LeadWithRelations, LeadsRepository } from './leads.repository';

@Injectable()
export class LeadsService {
  constructor(private readonly leadsRepository: LeadsRepository) {}

  async create(
    dto: CreateLeadDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<LeadWithRelations> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);
    const sellerId = this.resolveSellerIdForWrite(dto.sellerId, actor);

    return this.leadsRepository.create({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      origin: dto.origin,
      status: dto.status,
      notes: dto.notes,
      company: { connect: { id: companyId } },
      ...(sellerId ? { seller: { connect: { id: sellerId } } } : {}),
      ...(dto.customerId
        ? { customer: { connect: { id: dto.customerId } } }
        : {}),
      ...(dto.vehicleId
        ? { vehicle: { connect: { id: dto.vehicleId } } }
        : {}),
    });
  }

  async findAll(
    pagination: CompanyPaginationDto,
    actor: AuthenticatedUser,
  ): Promise<PaginatedResult<LeadWithRelations>> {
    const companyId = resolveTenantCompanyId(actor, pagination.companyId);
    const sellerFilter = this.resolveSellerFilter(actor);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.leadsRepository.findMany({
      companyId,
      sellerId: sellerFilter,
      skip,
      take: limit,
      search: pagination.search,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    });

    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(
    id: string,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<LeadWithRelations> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);
    const sellerFilter = this.resolveSellerFilter(actor);

    const lead = await this.leadsRepository.findById(
      id,
      companyId,
      sellerFilter,
    );

    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }

    return lead;
  }

  async update(
    id: string,
    dto: UpdateLeadDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<LeadWithRelations> {
    await this.findOne(id, actor, queryCompanyId);
    this.assertCanModify(actor);

    const { sellerId, customerId, vehicleId, ...rest } = dto;
    const updateData: Parameters<LeadsRepository['update']>[1] = { ...rest };

    if (sellerId !== undefined) {
      updateData.seller = sellerId
        ? { connect: { id: sellerId } }
        : { disconnect: true };
    }

    if (customerId !== undefined) {
      updateData.customer = customerId
        ? { connect: { id: customerId } }
        : { disconnect: true };
    }

    if (vehicleId !== undefined) {
      updateData.vehicle = vehicleId
        ? { connect: { id: vehicleId } }
        : { disconnect: true };
    }

    return this.leadsRepository.update(id, updateData);
  }

  async updateStatus(
    id: string,
    dto: UpdateLeadStatusDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<LeadWithRelations> {
    await this.findOne(id, actor, queryCompanyId);
    this.assertCanModify(actor);

    return this.leadsRepository.update(id, { status: dto.status });
  }

  async remove(
    id: string,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<LeadWithRelations> {
    await this.findOne(id, actor, queryCompanyId);
    this.assertCanModify(actor);
    return this.leadsRepository.delete(id) as Promise<LeadWithRelations>;
  }

  private resolveSellerFilter(actor: AuthenticatedUser): string | undefined {
    if (actor.role === Role.SELLER) {
      return actor.id;
    }
    return undefined;
  }

  private resolveSellerIdForWrite(
    dtoSellerId: string | undefined,
    actor: AuthenticatedUser,
  ): string | undefined {
    if (actor.role === Role.SELLER) {
      return actor.id;
    }
    return dtoSellerId;
  }

  private assertCanModify(actor: AuthenticatedUser): void {
    if (actor.role === Role.SELLER) {
      throw new ForbiddenException(
        'Vendedores não possuem permissão para alterar ou remover leads',
      );
    }
  }
}
