import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpsertEixoHeliceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diametroHelice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passoHelice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numPas?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diametroEixo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grauCone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comprimentoCone?: string;
}
