import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpsertCaixaReversoraDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ratio?: string;
}
