import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateClienteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  @MaxLength(150, { message: 'Nome deve ter no máximo 150 caracteres' })
  nome!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  contatoNome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'contatoEmail deve ser um e-mail válido' })
  @MaxLength(150)
  contatoEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contatoTelefone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}
