import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsEmail({}, { message: 'E-mail ou senha inválidos' })
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'E-mail ou senha inválidos' })
  senha!: string;
}
