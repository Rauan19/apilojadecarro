import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'Profissional' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'pro' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Ideal para lojas em crescimento' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 197, description: 'Preço mensal em BRL' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @ApiProperty({
    type: [String],
    example: ['Veículos ilimitados', 'Até 15 usuários', 'API pública'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  features: string[];

  @ApiPropertyOptional({ example: 100, description: 'null = ilimitado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxVehicles?: number | null;

  @ApiPropertyOptional({ example: 10, description: 'null = ilimitado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsers?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
