import { Body, Controller, Get, Param, ParseIntPipe, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MotoresService } from './motores.service';
import { UpdateMotorDto } from './dto/update-motor.dto';
import { UpdateHorimetroDto } from './dto/update-horimetro.dto';
import { UpsertCaixaReversoraDto } from './dto/upsert-caixa-reversora.dto';
import { UpsertEixoHeliceDto } from './dto/upsert-eixo-helice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';

@ApiTags('motores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller('motores')
export class MotoresController {
  constructor(private readonly motoresService: MotoresService) {}

  @Get(':id')
  getMotor(@Param('id', ParseIntPipe) id: number) {
    return this.motoresService.getMotor(id);
  }

  @Put(':id')
  updateMotor(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMotorDto) {
    return this.motoresService.updateMotor(id, dto);
  }

  @Patch(':id/horimetro')
  updateHorimetro(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHorimetroDto) {
    return this.motoresService.updateHorimetro(id, dto);
  }

  @Put(':id/caixa-reversora')
  upsertCaixaReversora(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertCaixaReversoraDto) {
    return this.motoresService.upsertCaixaReversora(id, dto);
  }

  @Put(':id/sistema-eixo-helice')
  upsertEixoHelice(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertEixoHeliceDto) {
    return this.motoresService.upsertEixoHelice(id, dto);
  }
}
