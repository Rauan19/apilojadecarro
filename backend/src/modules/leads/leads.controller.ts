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
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Criar lead' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async create(
    @Body() dto: CreateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.leadsService.create(dto, user, companyId);
    return { message: 'Lead criado com sucesso', data };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Listar leads paginados' })
  async findAll(
    @Query() pagination: CompanyPaginationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.leadsService.findAll(pagination, user);
    return { message: 'Leads listados com sucesso', data };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Buscar lead por ID' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.leadsService.findOne(id, user, companyId);
    return { message: 'Lead encontrado', data };
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Atualizar status do lead' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.leadsService.updateStatus(id, dto, user, companyId);
    return { message: 'Status do lead atualizado com sucesso', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Atualizar lead' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.leadsService.update(id, dto, user, companyId);
    return { message: 'Lead atualizado com sucesso', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Remover lead' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.leadsService.remove(id, user, companyId);
    return { message: 'Lead removido com sucesso', data };
  }
}
