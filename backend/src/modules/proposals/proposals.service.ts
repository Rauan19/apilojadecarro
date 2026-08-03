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
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import {
  ProposalWithRelations,
  ProposalsRepository,
} from './proposals.repository';

@Injectable()
export class ProposalsService {
  constructor(private readonly proposalsRepository: ProposalsRepository) {}

  async create(
    dto: CreateProposalDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<ProposalWithRelations> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);
    const sellerId = this.resolveSellerIdForWrite(dto.sellerId, actor);

    return this.proposalsRepository.create({
      value: dto.value,
      status: dto.status,
      notes: dto.notes,
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: dto.vehicleId } },
      customer: { connect: { id: dto.customerId } },
      ...(sellerId ? { seller: { connect: { id: sellerId } } } : {}),
    });
  }

  async findAll(
    pagination: CompanyPaginationDto,
    actor: AuthenticatedUser,
  ): Promise<PaginatedResult<ProposalWithRelations>> {
    const companyId = resolveTenantCompanyId(actor, pagination.companyId);
    const sellerFilter = this.resolveSellerFilter(actor);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.proposalsRepository.findMany({
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
  ): Promise<ProposalWithRelations> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);
    const sellerFilter = this.resolveSellerFilter(actor);

    const proposal = await this.proposalsRepository.findById(
      id,
      companyId,
      sellerFilter,
    );

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    return proposal;
  }

  async update(
    id: string,
    dto: UpdateProposalDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<ProposalWithRelations> {
    await this.findOne(id, actor, queryCompanyId);
    this.assertCanModify(actor);

    const { sellerId, vehicleId, customerId, ...rest } = dto;
    const updateData: Parameters<ProposalsRepository['update']>[1] = { ...rest };

    if (sellerId !== undefined) {
      updateData.seller = sellerId
        ? { connect: { id: sellerId } }
        : { disconnect: true };
    }

    if (vehicleId !== undefined) {
      updateData.vehicle = { connect: { id: vehicleId } };
    }

    if (customerId !== undefined) {
      updateData.customer = { connect: { id: customerId } };
    }

    return this.proposalsRepository.update(id, updateData);
  }

  async remove(
    id: string,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<ProposalWithRelations> {
    await this.findOne(id, actor, queryCompanyId);
    this.assertCanModify(actor);
    return this.proposalsRepository.delete(id) as Promise<ProposalWithRelations>;
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
        'Vendedores não possuem permissão para alterar ou remover propostas',
      );
    }
  }
}
