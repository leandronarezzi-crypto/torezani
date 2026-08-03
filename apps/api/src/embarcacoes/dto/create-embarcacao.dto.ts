import { ApiProperty } from '@nestjs/swagger';
import { TipoConfiguracao } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateEmbarcacaoDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  nome!: string;

  @ApiProperty({ enum: TipoConfiguracao })
  @IsEnum(TipoConfiguracao, { message: 'tipoConfiguracao deve ser MONOMOTOR ou BIMOTOR' })
  tipoConfiguracao!: TipoConfiguracao;
}
