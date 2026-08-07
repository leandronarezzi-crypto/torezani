import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CentrosCustoService } from './centros-custo.service';
import { UpsertCentroCustoDto } from './dto/upsert-centro-custo.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';

@ApiTags('centros-custo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller('centros-custo')
export class CentrosCustoController {
  constructor(private readonly centrosCustoService: CentrosCustoService) {}

  @Get()
  list() {
    return this.centrosCustoService.list();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.centrosCustoService.get(id);
  }

  @Post()
  create(@Body() dto: UpsertCentroCustoDto) {
    return this.centrosCustoService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertCentroCustoDto) {
    return this.centrosCustoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.centrosCustoService.remove(id);
  }
}
