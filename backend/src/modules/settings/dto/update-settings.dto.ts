import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'Auto Center São Paulo' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'contato@autocenter.com.br' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '12.345.678/0001-95',
    description: 'CPF ou CNPJ da loja. Obrigatório para assinar um plano.',
  })
  @IsOptional()
  @IsString()
  document?: string;

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

  @ApiPropertyOptional({
    example: 'www.minhaloja.com.br',
    description: 'Domínio próprio opcional da vitrine (sem http/https)',
  })
  @IsOptional()
  @IsString()
  customDomain?: string | null;

  @ApiPropertyOptional({
    description: 'Configurações do site em JSON string',
    example:
      '{"theme":{"primaryColor":"#e10600"},"about":"Sobre nós","whatsapp":"5511999999999","social":{"instagram":"@loja"}}',
  })
  @IsOptional()
  @IsString()
  settings?: string;
}
