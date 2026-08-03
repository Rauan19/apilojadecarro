import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersFilterDto } from './dto/users-filter.dto';
import { UserPublic, UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(private readonly usersRepository: UsersRepository) {}

  async create(
    dto: CreateUserDto,
    actor: AuthenticatedUser,
  ): Promise<UserPublic> {
    this.assertCanManageRole(actor, dto.role);

    const companyId = this.resolveCompanyIdForCreate(dto, actor);

    if (dto.role !== Role.SUPER_ADMIN && !companyId) {
      throw new BadRequestException(
        'companyId é obrigatório para usuários de loja',
      );
    }

    if (await this.usersRepository.emailExists(dto.email)) {
      throw new ConflictException('E-mail já está em uso');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    return this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      ...(companyId ? { company: { connect: { id: companyId } } } : {}),
      phone: dto.phone,
      active: dto.active ?? true,
    });
  }

  async findAll(
    pagination: UsersFilterDto,
    actor: AuthenticatedUser,
  ): Promise<PaginatedResult<UserPublic>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;
    const companyId = this.resolveCompanyFilter(actor, pagination.companyId);

    const { items, total } = await this.usersRepository.findMany({
      skip,
      take: limit,
      companyId: companyId ?? undefined,
      role: pagination.role,
      active: pagination.active,
      search: pagination.search,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    });

    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, actor: AuthenticatedUser): Promise<UserPublic> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    this.assertCanAccessUser(actor, user.companyId, user.role);
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actor: AuthenticatedUser,
  ): Promise<UserPublic> {
    const existing = await this.findOne(id, actor);

    if (dto.role) {
      this.assertCanManageRole(actor, dto.role);
    }

    if (dto.email && dto.email !== existing.email) {
      if (await this.usersRepository.emailExists(dto.email, id)) {
        throw new ConflictException('E-mail já está em uso');
      }
    }

    let companyId = dto.companyId;
    if (actor.role === Role.STORE_ADMIN) {
      companyId = actor.companyId ?? undefined;
    }

    if (dto.role && dto.role !== Role.SUPER_ADMIN && !companyId && !existing.companyId) {
      throw new BadRequestException(
        'companyId é obrigatório para usuários de loja',
      );
    }

    const { password, companyId: _dtoCompanyId, ...rest } = dto;
    const updateData: Prisma.UserUpdateInput = {
      ...rest,
    };

    if (companyId !== undefined) {
      updateData.company = companyId
        ? { connect: { id: companyId } }
        : { disconnect: true };
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, this.saltRounds);
    }

    return this.usersRepository.update(id, updateData);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<UserPublic> {
    await this.findOne(id, actor);

    if (actor.id === id) {
      throw new BadRequestException('Não é possível remover o próprio usuário');
    }

    return this.usersRepository.delete(id);
  }

  private resolveCompanyIdForCreate(
    dto: CreateUserDto,
    actor: AuthenticatedUser,
  ): string | null {
    if (actor.role === Role.STORE_ADMIN) {
      if (!actor.companyId) {
        throw new ForbiddenException('Administrador sem empresa vinculada');
      }
      return actor.companyId;
    }

    if (dto.role === Role.SUPER_ADMIN) {
      return dto.companyId ?? null;
    }

    return dto.companyId ?? null;
  }

  private resolveCompanyFilter(
    actor: AuthenticatedUser,
    queryCompanyId?: string,
  ): string | null | undefined {
    if (actor.role === Role.SUPER_ADMIN) {
      return queryCompanyId || undefined;
    }

    if (!actor.companyId) {
      throw new ForbiddenException('Usuário sem empresa vinculada');
    }

    return actor.companyId;
  }

  private assertCanManageRole(actor: AuthenticatedUser, role: Role): void {
    if (actor.role === Role.SELLER) {
      throw new ForbiddenException(
        'Vendedores não possuem permissão para gerenciar usuários',
      );
    }

    if (actor.role === Role.STORE_ADMIN && role === Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Administradores de loja não podem criar ou atribuir SUPER_ADMIN',
      );
    }
  }

  private assertCanAccessUser(
    actor: AuthenticatedUser,
    targetCompanyId: string | null,
    targetRole: Role,
  ): void {
    if (actor.role === Role.SELLER) {
      throw new ForbiddenException(
        'Vendedores não possuem permissão para gerenciar usuários',
      );
    }

    if (actor.role === Role.STORE_ADMIN) {
      if (!actor.companyId || actor.companyId !== targetCompanyId) {
        throw new ForbiddenException(
          'Acesso permitido apenas para usuários da sua empresa',
        );
      }

      if (targetRole === Role.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Administradores de loja não podem gerenciar SUPER_ADMIN',
        );
      }
    }
  }
}
