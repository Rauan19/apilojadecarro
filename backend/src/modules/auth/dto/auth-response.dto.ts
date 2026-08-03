import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty({ example: 'uuid-do-usuario' })
  id!: string;

  @ApiProperty({ example: 'admin@lojadecarro.com' })
  email!: string;

  @ApiProperty({ example: 'Administrador' })
  name!: string;

  @ApiProperty({ enum: Role, example: Role.STORE_ADMIN })
  role!: Role;

  @ApiPropertyOptional({
    example: 'uuid-da-empresa',
    nullable: true,
    description: 'Null para Super Admin',
  })
  companyId!: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT de acesso' })
  accessToken!: string;

  @ApiProperty({ description: 'Token opaco para renovação' })
  refreshToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
