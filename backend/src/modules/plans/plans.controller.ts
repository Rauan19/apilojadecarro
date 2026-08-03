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
import { Roles } from '../../common/decorators';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlansService } from './plans.service';

@ApiTags('Plans')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @ApiOperation({ summary: 'Criar plano (Super Admin)' })
  async create(@Body() dto: CreatePlanDto) {
    const data = await this.plansService.create(dto);
    return { message: 'Plano criado com sucesso', data };
  }

  @Get()
  @ApiOperation({ summary: 'Listar planos' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const data = await this.plansService.findAll(activeOnly === 'true');
    return { message: 'Planos listados com sucesso', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar plano por ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.plansService.findOne(id);
    return { message: 'Plano encontrado', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar plano' })
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const data = await this.plansService.update(id, dto);
    return { message: 'Plano atualizado com sucesso', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover plano' })
  async remove(@Param('id') id: string) {
    const data = await this.plansService.remove(id);
    return { message: 'Plano removido com sucesso', data };
  }
}
