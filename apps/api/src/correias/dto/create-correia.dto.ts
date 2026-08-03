import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCorreiaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  funcaoAplicacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  especificacaoTamanho?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade?: number;
}
