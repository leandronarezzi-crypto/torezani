import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoManutencao } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpsertManutencaoDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'tipoServico é obrigatório' })
  @MaxLength(255, { message: 'tipoServico deve ter no máximo 255 caracteres' })
  tipoServico!: string;

  @ApiPropertyOptional({ enum: TipoManutencao, description: 'Padrao PREVENTIVA se omitido.' })
  @IsOptional()
  @IsEnum(TipoManutencao, { message: 'tipo deve ser PREVENTIVA, PREDITIVA ou CORRETIVA' })
  tipo?: TipoManutencao;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  horimetroUltimaTroca?: number;

  @ApiPropertyOptional({ description: 'Obrigatorio apenas para tipo PREVENTIVA.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'intervaloHoras deve ser maior que zero' })
  intervaloHoras?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  alertaLimiteHoras?: number;

  @ApiPropertyOptional({ description: 'Data do evento. So usado para tipo PREDITIVA/CORRETIVA (o cadastro ja registra a ocorrencia).' })
  @IsOptional()
  @IsDateString()
  dataExecucao?: string;

  @ApiPropertyOptional({ description: 'Observacoes do evento. So usado para tipo PREDITIVA/CORRETIVA.' })
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
