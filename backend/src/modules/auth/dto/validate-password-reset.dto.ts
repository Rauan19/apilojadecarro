import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ValidatePasswordResetDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  token: string;
}
