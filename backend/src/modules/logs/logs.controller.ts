import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { ApiLogsFilterDto } from './dto/api-logs-filter.dto';
import { LogsService } from './logs.service';

@ApiTags('Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('api')
  @ApiOperation({ summary: 'Listar logs de API paginados' })
  async findApiLogs(@Query() filters: ApiLogsFilterDto) {
    const data = await this.logsService.findApiLogs(filters);
    return { message: 'Logs listados com sucesso', data };
  }
}
