import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpsertManutencaoDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'tipoServico é obrigatório' })
  @MaxLength(255, { message: 'tipoServico deve ter no máximo 255 caracteres' })
  tipoServico!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  horimetroUltimaTroca?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'intervaloHoras deve ser maior que zero' })
  intervaloHoras!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  alertaLimiteHoras?: number;
}
