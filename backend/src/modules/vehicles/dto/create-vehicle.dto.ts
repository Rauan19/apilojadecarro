import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelType, Transmission, VehicleStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @MinLength(1)
  brand: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @MinLength(1)
  model: string;

  @ApiPropertyOptional({ example: 'XEi 2.0 Flex' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ example: 2022 })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year: number;

  @ApiProperty({ example: 2023 })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearModel: number;

  @ApiProperty({ example: 89900 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 45000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ example: 'ABC1D23' })
  @IsOptional()
  @IsString()
  plate?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @IsString()
  renavam?: string;

  @ApiPropertyOptional({ enum: FuelType, default: FuelType.FLEX })
  @IsOptional()
  @IsEnum(FuelType)
  fuel?: FuelType;

  @ApiPropertyOptional({ enum: Transmission, default: Transmission.MANUAL })
  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @ApiPropertyOptional({ example: 'Prata' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 4, default: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doors?: number;

  @ApiPropertyOptional({ example: 'Veículo em excelente estado de conservação' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Opcionais como string JSON ou array de strings',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['Ar condicionado', 'Direção elétrica'],
  })
  @IsOptional()
  optionals?: string | string[];

  @ApiPropertyOptional({ enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
