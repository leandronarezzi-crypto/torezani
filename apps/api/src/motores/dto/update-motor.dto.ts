import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMotorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  potenciaConfig?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numSerie?: string;
}
