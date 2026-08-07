import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetBotEnabledDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}
