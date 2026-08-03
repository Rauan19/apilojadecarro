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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar cliente' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.customersService.create(dto, user, companyId);
    return { message: 'Cliente criado com sucesso', data };
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes paginados' })
  async findAll(
    @Query() pagination: CompanyPaginationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.customersService.findAll(pagination, user);
    return { message: 'Clientes listados com sucesso', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.customersService.findOne(id, user, companyId);
    return { message: 'Cliente encontrado', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.customersService.update(id, dto, user, companyId);
    return { message: 'Cliente atualizado com sucesso', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cliente' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.customersService.remove(id, user, companyId);
    return { message: 'Cliente removido com sucesso', data };
  }
}
