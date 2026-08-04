import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMotorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'marca deve ter no máximo 50 caracteres' })
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'modelo deve ter no máximo 50 caracteres' })
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'potenciaConfig deve ter no máximo 50 caracteres' })
  potenciaConfig?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'numSerie deve ter no máximo 50 caracteres' })
  numSerie?: string;
}
