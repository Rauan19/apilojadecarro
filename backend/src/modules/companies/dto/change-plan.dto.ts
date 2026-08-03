import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChangePlanDto {
  @ApiProperty({ format: 'uuid', description: 'ID do plano criado pelo Super Admin' })
  @IsUUID()
  planId: string;
}
