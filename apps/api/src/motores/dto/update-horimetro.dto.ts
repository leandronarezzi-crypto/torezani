import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpdateHorimetroDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber({}, { message: 'horimetroAtual deve ser um número não negativo' })
  @Min(0, { message: 'horimetroAtual deve ser um número não negativo' })
  horimetroAtual!: number;
}
