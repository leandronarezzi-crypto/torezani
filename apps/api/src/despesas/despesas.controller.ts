import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CategoriaDespesa } from '@prisma/client';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('despesas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller('despesas')
export class DespesasController {
  constructor(private readonly despesasService: DespesasService) {}

  @Get()
  @ApiQuery({ name: 'embarcacaoId', required: false })
  @ApiQuery({ name: 'categoria', required: false, enum: CategoriaDespesa })
  @ApiQuery({ name: 'centroCustoId', required: false })
  @ApiQuery({ name: 'dataInicio', required: false })
  @ApiQuery({ name: 'dataFim', required: false })
  list(
    @Query('embarcacaoId') embarcacaoId?: string,
    @Query('categoria') categoria?: CategoriaDespesa,
    @Query('centroCustoId') centroCustoId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.despesasService.list({
      embarcacaoId: embarcacaoId ? Number(embarcacaoId) : undefined,
      categoria,
      centroCustoId: centroCustoId ? Number(centroCustoId) : undefined,
      dataInicio,
      dataFim,
    });
  }

  // ATENCAO: precisa vir ANTES de @Get(':id'), senao "lixeira" viraria um id.
  @Get('lixeira')
  @UseGuards(AdminGuard)
  listExcluidas() {
    return this.despesasService.listExcluidas();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.despesasService.get(id);
  }

  @Post()
  create(@Body() dto: CreateDespesaDto) {
    return this.despesasService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDespesaDto) {
    return this.despesasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.despesasService.remove(id);
  }

  @Post(':id/restaurar')
  @UseGuards(AdminGuard)
  restaurar(@Param('id', ParseIntPipe) id: number) {
    return this.despesasService.restaurar(id);
  }
}
