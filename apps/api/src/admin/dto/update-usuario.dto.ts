import { ApiPropertyOptional } from '@nestjs/swagger';
import { Papel, StatusUsuario } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ enum: Papel })
  @IsOptional()
  @IsEnum(Papel, { message: 'Papel inválido' })
  papel?: Papel;

  @ApiPropertyOptional({ enum: StatusUsuario })
  @IsOptional()
  @IsEnum(StatusUsuario, { message: 'Status inválido' })
  status?: StatusUsuario;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Senha deve ter ao menos 6 caracteres' })
  senha?: string;
}
