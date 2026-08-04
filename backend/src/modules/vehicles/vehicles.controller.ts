import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { CompanyPaginationDto } from '../../common/dto/company-pagination.dto';
import type { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Criar veículo' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.vehiclesService.create(dto, user, companyId);
    return { message: 'Veículo criado com sucesso', data };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Listar veículos paginados' })
  async findAll(
    @Query() pagination: CompanyPaginationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.vehiclesService.findAll(pagination, user);
    return { message: 'Veículos listados com sucesso', data };
  }

  @Get('lookup-plate/:plate')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Consultar dados do veículo pela placa' })
  async lookupPlate(@Param('plate') plate: string) {
    const data = await this.vehiclesService.lookupPlate(plate);
    return { message: 'Consulta realizada com sucesso', data };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.vehiclesService.findOne(id, user, companyId);
    return { message: 'Veículo encontrado', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Atualizar veículo' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.vehiclesService.update(id, dto, user, companyId);
    return { message: 'Veículo atualizado com sucesso', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Remover veículo' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.vehiclesService.remove(id, user, companyId);
    return { message: 'Veículo removido com sucesso', data };
  }

  @Post(':id/images')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Adicionar imagens ao veículo' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async addImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.vehiclesService.addImages(
      id,
      files,
      user,
      companyId,
    );
    return { message: 'Imagens adicionadas com sucesso', data };
  }

  @Delete(':id/images/:imageId')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Remover imagem do veículo' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.vehiclesService.removeImage(
      id,
      imageId,
      user,
      companyId,
    );
    return { message: 'Imagem removida com sucesso', data };
  }
}
