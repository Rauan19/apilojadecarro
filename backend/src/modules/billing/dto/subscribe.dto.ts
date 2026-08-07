import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Plano que a loja quer assinar',
  })
  @IsUUID()
  planId: string;
}
