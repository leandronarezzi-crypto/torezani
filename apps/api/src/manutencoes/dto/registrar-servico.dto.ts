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

  @ApiPropertyOptional({ description: 'Custo do servico. Se informado em Preditiva/Corretiva, gera uma Despesa automaticamente.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fornecedor?: string;
}
