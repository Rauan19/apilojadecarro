import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class CompanyPaginationDto extends PaginationDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Obrigatório para SUPER_ADMIN ao filtrar por empresa',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
