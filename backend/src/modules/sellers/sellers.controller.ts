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
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { SellersService } from './sellers.service';

@ApiTags('Sellers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar vendedor' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async create(
    @Body() dto: CreateSellerDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.sellersService.create(dto, user, companyId);
    return { message: 'Vendedor criado com sucesso', data };
  }

  @Get()
  @ApiOperation({ summary: 'Listar vendedores paginados' })
  async findAll(
    @Query() pagination: CompanyPaginationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sellersService.findAll(pagination, user);
    return { message: 'Vendedores listados com sucesso', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar vendedor por ID' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.sellersService.findOne(id, user, companyId);
    return { message: 'Vendedor encontrado', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar vendedor' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSellerDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.sellersService.update(id, dto, user, companyId);
    return { message: 'Vendedor atualizado com sucesso', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover vendedor' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.sellersService.remove(id, user, companyId);
    return { message: 'Vendedor removido com sucesso', data };
  }
}
