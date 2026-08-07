import {
  Body,
  Controller,
  Get,
  Patch,
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
import { AllowWhenBlocked, CurrentUser, Roles } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  // A tela de bloqueio mostra nome e logo da loja, e o CPF/CNPJ é pré-requisito
  // da cobrança — ler configurações precisa continuar valendo.
  @AllowWhenBlocked()
  @ApiOperation({ summary: 'Obter configurações da empresa' })
  @ApiQuery({ name: 'companyId', required: false })
  async getSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.settingsService.getSettings(user, companyId);
    return { message: 'Configurações obtidas com sucesso', data };
  }

  @Patch()
  // Loja bloqueada sem CPF/CNPJ cadastrado não conseguiria emitir o PIX; sem
  // isso ela ficaria travada sem saída.
  @AllowWhenBlocked()
  @ApiOperation({ summary: 'Atualizar configurações da empresa' })
  @ApiQuery({ name: 'companyId', required: false })
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSettingsDto,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.settingsService.updateSettings(
      user,
      dto,
      companyId,
    );
    return { message: 'Configurações atualizadas com sucesso', data };
  }
}
