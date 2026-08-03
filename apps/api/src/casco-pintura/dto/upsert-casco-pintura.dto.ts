import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoIntervencao } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertCascoPinturaDto {
  @ApiProperty({ enum: TipoIntervencao })
  @IsEnum(TipoIntervencao, { message: 'tipoIntervencao deve ser CASCO ou PINTURA' })
  tipoIntervencao!: TipoIntervencao;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataExecucao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  horimetroEmbarcacao?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  esquemaProdutos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  historicoObservacoes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  alertaVencimentoData?: string;
}
