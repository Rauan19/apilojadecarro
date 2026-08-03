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
import {
  CustomerWithSeller,
  CustomersRepository,
} from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(
    dto: CreateCustomerDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<CustomerWithSeller> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);
    const sellerId = this.resolveSellerIdForWrite(dto.sellerId, actor);

    return this.customersRepository.create({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      city: dto.city,
      state: dto.state,
      notes: dto.notes,
      company: { connect: { id: companyId } },
      ...(sellerId ? { seller: { connect: { id: sellerId } } } : {}),
    });
  }

  async findAll(
    pagination: CompanyPaginationDto,
    actor: AuthenticatedUser,
  ): Promise<PaginatedResult<CustomerWithSeller>> {
    const companyId = resolveTenantCompanyId(actor, pagination.companyId);
    const sellerFilter = this.resolveSellerFilter(actor);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.customersRepository.findMany({
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
  ): Promise<CustomerWithSeller> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);
    const sellerFilter = this.resolveSellerFilter(actor);

    const customer = await this.customersRepository.findById(
      id,
      companyId,
      sellerFilter,
    );

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<CustomerWithSeller> {
    await this.findOne(id, actor, queryCompanyId);

    if (actor.role === Role.SELLER && dto.sellerId && dto.sellerId !== actor.id) {
      throw new ForbiddenException(
        'Vendedores não podem reatribuir clientes a outros vendedores',
      );
    }

    const { sellerId, ...rest } = dto;
    const updateData: Parameters<
      CustomersRepository['update']
    >[1] = { ...rest };

    if (actor.role === Role.SELLER) {
      updateData.seller = { connect: { id: actor.id } };
    } else if (sellerId !== undefined) {
      updateData.seller = sellerId
        ? { connect: { id: sellerId } }
        : { disconnect: true };
    }

    return this.customersRepository.update(id, updateData);
  }

  async remove(
    id: string,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<CustomerWithSeller> {
    await this.findOne(id, actor, queryCompanyId);
    return this.customersRepository.delete(id) as Promise<CustomerWithSeller>;
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
}
