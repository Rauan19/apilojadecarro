import { ApiProperty } from '@nestjs/swagger';
import { CompanyStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CompanyStatusDto {
  @ApiProperty({ enum: CompanyStatus, example: CompanyStatus.ACTIVE })
  @IsEnum(CompanyStatus)
  status: CompanyStatus;
}
