import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StatusReceita } from '@prisma/client';
import { ReceitasService } from './receitas.service';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('receitas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller('receitas')
export class ReceitasController {
  constructor(private readonly receitasService: ReceitasService) {}

  @Get()
  @ApiQuery({ name: 'clienteId', required: false })
  @ApiQuery({ name: 'contratoId', required: false })
  @ApiQuery({ name: 'embarcacaoId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: StatusReceita })
  @ApiQuery({ name: 'dataInicio', required: false })
  @ApiQuery({ name: 'dataFim', required: false })
  list(
    @Query('clienteId') clienteId?: string,
    @Query('contratoId') contratoId?: string,
    @Query('embarcacaoId') embarcacaoId?: string,
    @Query('status') status?: StatusReceita,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.receitasService.list({
      clienteId: clienteId ? Number(clienteId) : undefined,
      contratoId: contratoId ? Number(contratoId) : undefined,
      embarcacaoId: embarcacaoId ? Number(embarcacaoId) : undefined,
      status,
      dataInicio,
      dataFim,
    });
  }

  // ATENCAO: precisa vir ANTES de @Get(':id'), senao "lixeira" viraria um id.
  @Get('lixeira')
  @UseGuards(AdminGuard)
  listExcluidas() {
    return this.receitasService.listExcluidas();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.receitasService.get(id);
  }

  @Post()
  create(@Body() dto: CreateReceitaDto) {
    return this.receitasService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReceitaDto) {
    return this.receitasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.receitasService.remove(id);
  }

  @Post(':id/restaurar')
  @UseGuards(AdminGuard)
  restaurar(@Param('id', ParseIntPipe) id: number) {
    return this.receitasService.restaurar(id);
  }
}
