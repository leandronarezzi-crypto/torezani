import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertEixoHeliceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'diametroHelice deve ter no máximo 50 caracteres' })
  diametroHelice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'passoHelice deve ter no máximo 50 caracteres' })
  passoHelice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numPas?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'diametroEixo deve ter no máximo 50 caracteres' })
  diametroEixo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'grauCone deve ter no máximo 50 caracteres' })
  grauCone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'comprimentoCone deve ter no máximo 50 caracteres' })
  comprimentoCone?: string;
}
