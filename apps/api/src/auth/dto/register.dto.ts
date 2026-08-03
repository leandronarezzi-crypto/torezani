import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  nome!: string;

  @ApiProperty()
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'Senha deve ter ao menos 6 caracteres' })
  senha!: string;
}
