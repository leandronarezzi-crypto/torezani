import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  list() {
    return this.clientesService.list();
  }

  // ATENCAO: precisa vir ANTES de @Get(':id'), senao "lixeira" viraria um id.
  @Get('lixeira')
  @UseGuards(AdminGuard)
  listExcluidos() {
    return this.clientesService.listExcluidos();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.get(id);
  }

  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.clientesService.remove(id);
  }

  @Post(':id/restaurar')
  @UseGuards(AdminGuard)
  restaurar(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.restaurar(id);
  }
}
