import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export enum PublicLeadInterestType {
  INTEREST = 'INTEREST',
  FINANCING = 'FINANCING',
  CASH = 'CASH',
  TRADE_IN = 'TRADE_IN',
  VISIT = 'VISIT',
}

export class CreatePublicLeadDto {
  @ApiProperty({ example: 'Maria Souza' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: '(11) 98888-7777' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    enum: PublicLeadInterestType,
    example: PublicLeadInterestType.FINANCING,
  })
  @IsOptional()
  @IsEnum(PublicLeadInterestType)
  interestType?: PublicLeadInterestType;

  @ApiPropertyOptional({
    example: 'Entrada de R$ 20.000, deseja 48x',
    description: 'Detalhes de financiamento, troca ou mensagem',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
