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
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CompaniesService } from './companies.service';
import { ChangePlanDto } from './dto/change-plan.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Companies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar cliente com admin e senha inicial' })
  async create(@Body() dto: CreateCompanyDto) {
    const data = await this.companiesService.create(dto);
    return { message: 'Cliente criado com sucesso', data };
  }

  @Post(':id/password-change-link')
  @ApiOperation({ summary: 'Gerar link para o admin da loja alterar a senha' })
  async createPasswordChangeLink(@Param('id') id: string) {
    const data = await this.companiesService.createPasswordChangeLink(id);
    return { message: 'Link gerado com sucesso', data };
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Visão geral de billing e estatísticas dos clientes' })
  async getStatsOverview() {
    const data = await this.companiesService.getStatsOverview();
    return { message: 'Estatísticas obtidas com sucesso', data };
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes paginados' })
  async findAll(@Query() pagination: PaginationDto) {
    const data = await this.companiesService.findAll(pagination);
    return { message: 'Clientes listados com sucesso', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.companiesService.findOne(id);
    return { message: 'Cliente encontrado', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    const data = await this.companiesService.update(id, dto);
    return { message: 'Cliente atualizado com sucesso', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cliente' })
  async remove(@Param('id') id: string) {
    const data = await this.companiesService.remove(id);
    return { message: 'Cliente removido com sucesso', data };
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Bloquear cliente' })
  async block(@Param('id') id: string) {
    const data = await this.companiesService.block(id);
    return { message: 'Cliente bloqueado com sucesso', data };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Ativar cliente' })
  async activate(@Param('id') id: string) {
    const data = await this.companiesService.activate(id);
    return { message: 'Cliente ativado com sucesso', data };
  }

  @Patch(':id/plan')
  @ApiOperation({ summary: 'Alterar plano do cliente' })
  async changePlan(@Param('id') id: string, @Body() dto: ChangePlanDto) {
    const data = await this.companiesService.changePlan(id, dto);
    return { message: 'Plano alterado com sucesso', data };
  }
}
