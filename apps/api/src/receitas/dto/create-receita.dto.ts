import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusReceita } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateReceitaDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  clienteId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contratoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  embarcacaoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  tipoServico?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorContratado?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorFaturado?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorRecebido?: number;

  @ApiProperty()
  @IsDateString()
  data!: string;

  @ApiPropertyOptional({ enum: StatusReceita })
  @IsOptional()
  @IsEnum(StatusReceita, { message: 'status deve ser RECEBIDO, PENDENTE ou EM_ATRASO' })
  status?: StatusReceita;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}
