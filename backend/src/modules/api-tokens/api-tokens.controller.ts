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
import { ApiTokensService } from './api-tokens.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';

@ApiTags('API Tokens')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('api-tokens')
export class ApiTokensController {
  constructor(private readonly apiTokensService: ApiTokensService) {}

  @Post()
  @ApiOperation({ summary: 'Criar token de API para um cliente' })
  async create(@Body() dto: CreateApiTokenDto) {
    const data = await this.apiTokensService.create(dto);
    return {
      message:
        'Token de API criado com sucesso. Guarde o token — ele não será exibido novamente.',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar tokens de API por cliente' })
  @ApiQuery({
    name: 'companyId',
    required: true,
    description: 'ID do cliente (companyId)',
  })
  async findByCompany(@Query('companyId') companyId: string) {
    const data = await this.apiTokensService.findByCompany(companyId);
    return { message: 'Tokens listados com sucesso', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar token de API por ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.apiTokensService.findOne(id);
    return { message: 'Token encontrado', data };
  }

  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revogar token de API' })
  async revoke(@Param('id') id: string) {
    const data = await this.apiTokensService.revoke(id);
    return { message: 'Token revogado com sucesso', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover token de API' })
  async remove(@Param('id') id: string) {
    const data = await this.apiTokensService.remove(id);
    return { message: 'Token removido com sucesso', data };
  }
}
