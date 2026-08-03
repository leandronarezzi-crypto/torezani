import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ManutencoesService } from './manutencoes.service';
import { UpsertManutencaoDto } from './dto/upsert-manutencao.dto';
import { RegistrarServicoDto } from './dto/registrar-servico.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';

@ApiTags('manutencoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller()
export class ManutencoesController {
  constructor(private readonly manutencoesService: ManutencoesService) {}

  @Post('motores/:motorId/manutencoes')
  create(@Param('motorId', ParseIntPipe) motorId: number, @Body() dto: UpsertManutencaoDto) {
    return this.manutencoesService.create(motorId, dto);
  }

  @Put('manutencoes/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertManutencaoDto) {
    return this.manutencoesService.update(id, dto);
  }

  @Delete('manutencoes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.manutencoesService.remove(id);
  }

  @Patch('manutencoes/:id/registrar-servico')
  registrarServico(@Param('id', ParseIntPipe) id: number, @Body() dto: RegistrarServicoDto) {
    return this.manutencoesService.registrarServico(id, dto);
  }
}
