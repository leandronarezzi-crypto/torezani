import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditoriasService } from './auditorias.service';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';

@ApiTags('auditorias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller()
export class AuditoriasController {
  constructor(private readonly auditoriasService: AuditoriasService) {}

  @Get('auditorias/template')
  getTemplate() {
    return this.auditoriasService.getTemplate();
  }

  @Get('embarcacoes/:embarcacaoId/auditorias')
  listByEmbarcacao(@Param('embarcacaoId', ParseIntPipe) embarcacaoId: number) {
    return this.auditoriasService.listByEmbarcacaoId(embarcacaoId);
  }

  @Post('embarcacoes/:embarcacaoId/auditorias')
  create(@Param('embarcacaoId', ParseIntPipe) embarcacaoId: number, @Body() dto: CreateAuditoriaDto, @CurrentUser() user: AuthUser) {
    return this.auditoriasService.create(embarcacaoId, dto, user.id);
  }

  @Get('auditorias/:id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.auditoriasService.getById(id);
  }
}
