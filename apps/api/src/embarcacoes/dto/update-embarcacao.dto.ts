import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateEmbarcacaoDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  nome!: string;
}
