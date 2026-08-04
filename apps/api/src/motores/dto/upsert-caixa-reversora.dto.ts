import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertCaixaReversoraDto {
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
  @MaxLength(20, { message: 'ratio deve ter no máximo 20 caracteres' })
  ratio?: string;
}
