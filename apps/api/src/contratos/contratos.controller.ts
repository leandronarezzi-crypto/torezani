import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('contratos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller('contratos')
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Get()
  @ApiQuery({ name: 'clienteId', required: false })
  list(@Query('clienteId') clienteId?: string) {
    return this.contratosService.list(clienteId ? Number(clienteId) : undefined);
  }

  // ATENCAO: precisa vir ANTES de @Get(':id'), senao "lixeira" viraria um id.
  @Get('lixeira')
  @UseGuards(AdminGuard)
  listExcluidos() {
    return this.contratosService.listExcluidos();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.contratosService.get(id);
  }

  @Post()
  create(@Body() dto: CreateContratoDto) {
    return this.contratosService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContratoDto) {
    return this.contratosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.contratosService.remove(id);
  }

  @Post(':id/restaurar')
  @UseGuards(AdminGuard)
  restaurar(@Param('id', ParseIntPipe) id: number) {
    return this.contratosService.restaurar(id);
  }
}
