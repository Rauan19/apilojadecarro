import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CompanyPaginationDto } from '../../common/dto/company-pagination.dto';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { resolveTenantCompanyId } from '../../common/utils/tenant.util';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { SellerWithUser, SellersRepository } from './sellers.repository';

@Injectable()
export class SellersService {
  private readonly saltRounds = 10;

  constructor(private readonly sellersRepository: SellersRepository) {}

  async create(
    dto: CreateSellerDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<SellerWithUser> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);

    if (await this.sellersRepository.emailExists(dto.email)) {
      throw new ConflictException('E-mail já está em uso');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    return this.sellersRepository.create({
      companyId,
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      commission: dto.commission,
      notes: dto.notes,
      active: dto.active,
    });
  }

  async findAll(
    pagination: CompanyPaginationDto,
    actor: AuthenticatedUser,
  ): Promise<PaginatedResult<SellerWithUser>> {
    const companyId = resolveTenantCompanyId(actor, pagination.companyId);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.sellersRepository.findMany({
      companyId,
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
  ): Promise<SellerWithUser> {
    const companyId = resolveTenantCompanyId(actor, queryCompanyId);
    const seller = await this.sellersRepository.findById(id, companyId);

    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado');
    }

    return seller;
  }

  async update(
    id: string,
    dto: UpdateSellerDto,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<SellerWithUser> {
    const existing = await this.findOne(id, actor, queryCompanyId);

    if (dto.email && dto.email !== existing.user.email) {
      if (await this.sellersRepository.emailExists(dto.email, existing.userId)) {
        throw new ConflictException('E-mail já está em uso');
      }
    }

    const updateData = { ...dto };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, this.saltRounds);
    }

    return this.sellersRepository.update(id, existing.userId, updateData);
  }

  async remove(
    id: string,
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): Promise<SellerWithUser> {
    const existing = await this.findOne(id, actor, queryCompanyId);
    await this.sellersRepository.delete(id, existing.userId);
    return existing;
  }
}
