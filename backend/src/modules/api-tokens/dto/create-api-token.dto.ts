import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateApiTokenDto {
  @ApiProperty({ format: 'uuid', description: 'ID do cliente (loja/concessionária)' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ example: 'Integração Site' })
  @IsString()
  @MinLength(2)
  name: string;
}
