import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Auto Center São Paulo' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'auto-center-sp' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-90' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({ example: 'contato@autocenter.com.br' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Av. Paulista, 1000' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '01310-100' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'uploads/empresa-uuid/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: 'https://autocenter.com.br' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Plano do cliente' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ enum: CompanyStatus, default: CompanyStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional({
    description: 'Configurações em formato JSON string',
    example: '{"theme":"dark"}',
  })
  @IsOptional()
  @IsString()
  settings?: string;

  @ApiPropertyOptional({
    example: 'João Silva',
    description: 'Nome do admin da loja (padrão: Administrador)',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  adminName?: string;

  @ApiPropertyOptional({
    example: 'admin@loja.com.br',
    description: 'E-mail de login do admin (padrão: e-mail do cliente)',
  })
  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @ApiProperty({
    example: 'SenhaForte123',
    description: 'Senha inicial do admin da loja',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  adminPassword: string;
}
