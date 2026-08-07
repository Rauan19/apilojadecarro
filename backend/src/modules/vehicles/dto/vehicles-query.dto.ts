import { ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CompanyPaginationDto } from '../../../common/dto/company-pagination.dto';

export class VehiclesQueryDto extends CompanyPaginationDto {
  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;
}
