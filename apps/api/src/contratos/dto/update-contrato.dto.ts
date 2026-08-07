import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusContrato } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class UpdateContratoDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  clienteId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiProperty({ enum: StatusContrato })
  @IsEnum(StatusContrato, { message: 'status deve ser ATIVO, ENCERRADO ou SUSPENSO' })
  status!: StatusContrato;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}
