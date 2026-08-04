import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { PublicApiService } from '../public-api/public-api.service';
import { CreatePublicLeadDto } from '../public-api/dto/create-public-lead.dto';
import { CreatePublicScheduleDto } from '../public-api/dto/create-public-schedule.dto';
import { PublicVehicleFilterDto } from '../public-api/dto/public-vehicle-filter.dto';

/**
 * Vitrine multi-tenant do próprio sistema (/loja/:slug).
 * Não exige ApiToken: resolve a loja pelo slug ou domínio.
 * Sites externos vendidos aos clientes continuam usando /api/public/* + token.
 */
@ApiTags('Storefront')
@Public()
@Controller('store')
export class StorefrontController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('resolve')
  @ApiOperation({ summary: 'Resolver loja pelo domínio (Host)' })
  async resolveByHost(@Query('host') host: string) {
    const data = await this.publicApiService.resolveByHost(host ?? '');
    return { message: 'Loja resolvida com sucesso', data };
  }

  @Get(':slug/company')
  @ApiOperation({ summary: 'Informações públicas da loja por slug' })
  async getCompany(@Param('slug') slug: string) {
    const companyId = await this.publicApiService.resolveActiveCompanyIdBySlug(slug);
    const data = await this.publicApiService.getCompanyInfo(companyId);
    return { message: 'Empresa obtida com sucesso', data };
  }

  @Get(':slug/vehicles')
  @ApiOperation({ summary: 'Listar veículos da loja por slug' })
  async findVehicles(
    @Param('slug') slug: string,
    @Query() filters: PublicVehicleFilterDto,
  ) {
    const companyId = await this.publicApiService.resolveActiveCompanyIdBySlug(slug);
    const data = await this.publicApiService.findVehicles(companyId, filters);
    return { message: 'Veículos listados com sucesso', data };
  }

  @Get(':slug/vehicles/:id')
  @ApiOperation({ summary: 'Buscar veículo da loja por slug' })
  async findVehicleById(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const companyId = await this.publicApiService.resolveActiveCompanyIdBySlug(slug);
    const data = await this.publicApiService.findVehicleById(companyId, id);
    return { message: 'Veículo encontrado', data };
  }

  @Post(':slug/leads')
  @ApiOperation({ summary: 'Criar lead na loja por slug' })
  async createLead(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicLeadDto,
  ) {
    const companyId = await this.publicApiService.resolveActiveCompanyIdBySlug(slug);
    const data = await this.publicApiService.createLead(companyId, dto);
    return { message: 'Lead criado com sucesso', data };
  }

  @Post(':slug/schedule')
  @ApiOperation({ summary: 'Agendar visita na loja por slug' })
  async createSchedule(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicScheduleDto,
  ) {
    const companyId = await this.publicApiService.resolveActiveCompanyIdBySlug(slug);
    const data = await this.publicApiService.createSchedule(companyId, dto);
    return { message: 'Agendamento criado com sucesso', data };
  }
}
