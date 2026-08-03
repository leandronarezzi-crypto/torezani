import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAuditoriaItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  categoria!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  descricao!: string;

  @ApiProperty()
  @IsBoolean()
  concluido!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  ordem!: number;
}
