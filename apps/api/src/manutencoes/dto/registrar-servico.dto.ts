import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RegistrarServicoDto {
  @ApiPropertyOptional({ description: 'Horimetro em que o servico foi executado. Se omitido, usa o horimetro atual do motor.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  horimetro?: number;

  @ApiPropertyOptional({ description: 'Data da execucao. Se omitida, usa a data de hoje.' })
  @IsOptional()
  @IsDateString()
  dataExecucao?: string;

  @ApiPropertyOptional({ description: 'Observacoes do servico executado (pecas trocadas, oficina, etc).' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}
