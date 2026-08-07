import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertCentroCustoDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome!: string;

  @ApiPropertyOptional({ description: 'Id do centro de custo pai, para montar a hierarquia (ex.: Operação > Navegação).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  paiId?: number;
}
