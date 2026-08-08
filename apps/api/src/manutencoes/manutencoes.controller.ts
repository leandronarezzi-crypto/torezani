import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ManutencoesService } from './manutencoes.service';
import { UpsertManutencaoDto } from './dto/upsert-manutencao.dto';
import { RegistrarServicoDto } from './dto/registrar-servico.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import type { PeriodoRelatorio } from '../embarcacoes/relatorio.service';

@ApiTags('manutencoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller()
export class ManutencoesController {
  constructor(private readonly manutencoesService: ManutencoesService) {}

  /** Dashboard consolidado de manutencao (Preventiva/Preditiva/Corretiva) de toda a frota. */
  @Get('manutencoes/dashboard')
  @ApiQuery({ name: 'periodo', required: false, enum: ['3m', '6m', '12m', '60m', 'tudo'] })
  dashboard(@Query('periodo') periodo?: PeriodoRelatorio) {
    return this.manutencoesService.dashboardFrota(periodo ?? '12m');
  }

  @Post('motores/:motorId/manutencoes')
  create(
    @Param('motorId', ParseIntPipe) motorId: number,
    @Body() dto: UpsertManutencaoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.manutencoesService.create(motorId, dto, user);
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
  registrarServico(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarServicoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.manutencoesService.registrarServico(id, dto, user);
  }

  /** Historico completo de execucoes de um plano de manutencao. */
  @Get('manutencoes/:id/historico')
  historico(@Param('id', ParseIntPipe) id: number) {
    return this.manutencoesService.listarHistorico(id);
  }
}
