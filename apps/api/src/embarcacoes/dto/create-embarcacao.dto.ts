import { ApiProperty } from '@nestjs/swagger';
import { TipoConfiguracao } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEmbarcacaoDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome!: string;

  @ApiProperty({ enum: TipoConfiguracao })
  @IsEnum(TipoConfiguracao, { message: 'tipoConfiguracao deve ser MONOMOTOR ou BIMOTOR' })
  tipoConfiguracao!: TipoConfiguracao;
}
