import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateLocalizacaoDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude inválida (deve estar entre -90 e 90)' })
  @Min(-90, { message: 'Latitude inválida (deve estar entre -90 e 90)' })
  @Max(90, { message: 'Latitude inválida (deve estar entre -90 e 90)' })
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude inválida (deve estar entre -180 e 180)' })
  @Min(-180, { message: 'Longitude inválida (deve estar entre -180 e 180)' })
  @Max(180, { message: 'Longitude inválida (deve estar entre -180 e 180)' })
  longitude!: number;
}
