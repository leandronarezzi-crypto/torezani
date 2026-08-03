import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CascoPinturaService } from './casco-pintura.service';
import { UpsertCascoPinturaDto } from './dto/upsert-casco-pintura.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';

@ApiTags('casco-pintura')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller()
export class CascoPinturaController {
  constructor(private readonly cascoPinturaService: CascoPinturaService) {}

  @Post('embarcacoes/:embarcacaoId/casco-pintura')
  create(@Param('embarcacaoId', ParseIntPipe) embarcacaoId: number, @Body() dto: UpsertCascoPinturaDto) {
    return this.cascoPinturaService.create(embarcacaoId, dto);
  }

  @Put('casco-pintura/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertCascoPinturaDto) {
    return this.cascoPinturaService.update(id, dto);
  }

  @Delete('casco-pintura/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.cascoPinturaService.remove(id);
  }
}
