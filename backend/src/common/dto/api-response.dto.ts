import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional({ nullable: true, example: null })
  errors?: unknown[] | null;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    errors: unknown[] | null = null,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  static success<T>(
    data: T,
    message = 'Operação realizada com sucesso',
  ): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data, null);
  }

  static error(
    message: string,
    errors: unknown[] | null = null,
  ): ApiResponseDto<null> {
    return new ApiResponseDto(false, message, null, errors);
  }
}
