import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { CreateAuditoriaItemDto } from './create-auditoria-item.dto';

export class CreateAuditoriaDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Responsável é obrigatório' })
  responsavel!: string;

  @ApiProperty()
  @IsDateString()
  dataRealizacao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  horimetro?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoesGerais?: string;

  @ApiProperty({ type: [CreateAuditoriaItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'A auditoria precisa ter ao menos um item de checklist' })
  @ValidateNested({ each: true })
  @Type(() => CreateAuditoriaItemDto)
  itens!: CreateAuditoriaItemDto[];
}
