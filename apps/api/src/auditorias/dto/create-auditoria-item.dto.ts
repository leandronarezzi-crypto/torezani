import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAuditoriaItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50, { message: 'categoria deve ter no máximo 50 caracteres' })
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
