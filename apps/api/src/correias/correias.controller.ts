import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CorreiasService } from './correias.service';
import { CreateCorreiaDto } from './dto/create-correia.dto';
import { UpdateCorreiaDto } from './dto/update-correia.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';

@ApiTags('correias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller()
export class CorreiasController {
  constructor(private readonly correiasService: CorreiasService) {}

  @Post('motores/:motorId/correias')
  create(@Param('motorId', ParseIntPipe) motorId: number, @Body() dto: CreateCorreiaDto) {
    return this.correiasService.create(motorId, dto);
  }

  @Put('correias/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCorreiaDto) {
    return this.correiasService.update(id, dto);
  }

  @Delete('correias/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.correiasService.remove(id);
  }
}
