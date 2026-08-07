import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EmbarcacoesService } from './embarcacoes.service';
import { RelatorioService, PeriodoRelatorio } from './relatorio.service';
import { CreateEmbarcacaoDto } from './dto/create-embarcacao.dto';
import { UpdateEmbarcacaoDto } from './dto/update-embarcacao.dto';
import { UpdateLocalizacaoDto } from './dto/update-localizacao.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('embarcacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller('embarcacoes')
export class EmbarcacoesController {
  constructor(
    private readonly embarcacoesService: EmbarcacoesService,
    private readonly relatorioService: RelatorioService,
  ) {}

  @Get()
  list() {
    return this.embarcacoesService.list();
  }

  // ATENCAO: esta rota precisa vir ANTES de @Get(':id'),
  // senao "lixeira" seria interpretado como um id.
  @Get('lixeira')
  @UseGuards(AdminGuard)
  listExcluidas() {
    return this.embarcacoesService.listExcluidas();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.embarcacoesService.get(id);
  }

  @Get(':id/detail')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.embarcacoesService.getDetail(id);
  }

  /** Relatorio de auditoria da embarcacao, com filtro de periodo. */
  @Get(':id/relatorio')
  @ApiQuery({ name: 'periodo', required: false, enum: ['3m', '6m', '12m', '60m', 'tudo'] })
  relatorio(@Param('id', ParseIntPipe) id: number, @Query('periodo') periodo?: PeriodoRelatorio) {
    return this.relatorioService.gerar(id, periodo ?? '12m');
  }

  @Post()
  create(@Body() dto: CreateEmbarcacaoDto) {
    return this.embarcacoesService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmbarcacaoDto) {
    return this.embarcacoesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.embarcacoesService.remove(id);
  }

  @Post(':id/restaurar')
  @UseGuards(AdminGuard)
  restaurar(@Param('id', ParseIntPipe) id: number) {
    return this.embarcacoesService.restaurar(id);
  }

  @Patch(':id/localizacao')
  updateLocalizacao(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLocalizacaoDto) {
    return this.embarcacoesService.updateLocalizacao(id, dto);
  }
}
