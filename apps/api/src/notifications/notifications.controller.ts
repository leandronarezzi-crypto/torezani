import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WriteGuard } from '../common/guards/write.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GravacaoPessoal } from '../common/decorators/gravacao-pessoal.decorator';
import type { AuthUser } from '../common/types/auth-user';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WriteGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.listForUser(user.id);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getSummary(user.id);
  }

  @GravacaoPessoal()
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.notificationsService.marcarLida(user.id, id);
  }

  @GravacaoPessoal()
  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@CurrentUser() user: AuthUser) {
    await this.notificationsService.marcarTodasLidas(user.id);
  }
}
