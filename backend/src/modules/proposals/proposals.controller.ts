import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { CompanyPaginationDto } from '../../common/dto/company-pagination.dto';
import type { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { ProposalsService } from './proposals.service';

@ApiTags('Proposals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Criar proposta' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async create(
    @Body() dto: CreateProposalDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.proposalsService.create(dto, user, companyId);
    return { message: 'Proposta criada com sucesso', data };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Listar propostas paginadas' })
  async findAll(
    @Query() pagination: CompanyPaginationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.proposalsService.findAll(pagination, user);
    return { message: 'Propostas listadas com sucesso', data };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Buscar proposta por ID' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.proposalsService.findOne(id, user, companyId);
    return { message: 'Proposta encontrada', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Atualizar proposta' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.proposalsService.update(id, dto, user, companyId);
    return { message: 'Proposta atualizada com sucesso', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Remover proposta' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.proposalsService.remove(id, user, companyId);
    return { message: 'Proposta removida com sucesso', data };
  }
}
