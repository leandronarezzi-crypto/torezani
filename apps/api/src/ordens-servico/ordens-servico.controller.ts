import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdensServicoService } from './ordens-servico.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';

@ApiTags('ordens-servico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller('ordens-servico')
export class OrdensServicoController {
  constructor(private readonly ordensServicoService: OrdensServicoService) {}

  @Get()
  @ApiQuery({ name: 'embarcacaoId', required: false })
  list(@Query('embarcacaoId') embarcacaoId?: string) {
    return this.ordensServicoService.list(embarcacaoId ? Number(embarcacaoId) : undefined);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.ordensServicoService.get(id);
  }

  @Post()
  gerar(@Body() dto: CreateOrdemServicoDto, @CurrentUser() user: AuthUser) {
    return this.ordensServicoService.gerar(dto, user);
  }
}
