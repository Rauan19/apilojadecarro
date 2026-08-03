import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public, CompanyId } from '../../common/decorators';
import { PublicApiService } from './public-api.service';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { CreatePublicScheduleDto } from './dto/create-public-schedule.dto';
import { PublicVehicleFilterDto } from './dto/public-vehicle-filter.dto';

@ApiTags('Public API')
@ApiSecurity('api-token')
@Public()
@Controller('public')
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('vehicles')
  @ApiOperation({ summary: 'Listar veículos disponíveis' })
  async findVehicles(
    @CompanyId() companyId: string | null,
    @Query() filters: PublicVehicleFilterDto,
  ) {
    const data = await this.publicApiService.findVehicles(companyId, filters);
    return { message: 'Veículos listados com sucesso', data };
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  async findVehicleById(
    @CompanyId() companyId: string | null,
    @Param('id') id: string,
  ) {
    const data = await this.publicApiService.findVehicleById(companyId, id);
    return { message: 'Veículo encontrado', data };
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar veículos disponíveis (alias)' })
  async search(
    @CompanyId() companyId: string | null,
    @Query() filters: PublicVehicleFilterDto,
  ) {
    const data = await this.publicApiService.findVehicles(companyId, filters);
    return { message: 'Busca realizada com sucesso', data };
  }

  @Post('leads')
  @ApiOperation({ summary: 'Criar lead via site' })
  async createLead(
    @CompanyId() companyId: string | null,
    @Body() dto: CreatePublicLeadDto,
  ) {
    const data = await this.publicApiService.createLead(companyId, dto);
    return { message: 'Lead criado com sucesso', data };
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Agendar visita ou test-drive' })
  async createSchedule(
    @CompanyId() companyId: string | null,
    @Body() dto: CreatePublicScheduleDto,
  ) {
    const data = await this.publicApiService.createSchedule(companyId, dto);
    return { message: 'Agendamento criado com sucesso', data };
  }

  @Get('company')
  @ApiOperation({ summary: 'Obter informações públicas da empresa' })
  async getCompany(@CompanyId() companyId: string | null) {
    const data = await this.publicApiService.getCompanyInfo(companyId);
    return { message: 'Empresa obtida com sucesso', data };
  }
}
