import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrdemServicoDto {
  @ApiProperty({ description: 'Id da manutenção (plano) para a qual a OS está sendo emitida.' })
  @Type(() => Number)
  @IsInt()
  manutencaoId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}
