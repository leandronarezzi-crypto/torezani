import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('usuarios')
  listUsuarios() {
    return this.adminService.listUsuarios();
  }

  @Patch('usuarios/:id')
  atualizarUsuario(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.adminService.atualizarUsuario(id, dto);
  }

  @Delete('usuarios/:id')
  deletarUsuario(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.adminService.deletarUsuario(id, user.id);
  }
}
