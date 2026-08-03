import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const USER_SELECT = {
  id: true,
  nome: true,
  email: true,
  papel: true,
  status: true,
  criadoEm: true,
} as const;

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listUsuarios() {
    return this.prisma.usuario.findMany({
      select: USER_SELECT,
      orderBy: [{ status: 'asc' }, { criadoEm: 'desc' }],
    });
  }

  async atualizarUsuario(id: number, dto: UpdateUsuarioDto) {
    const atual = await this.prisma.usuario.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Sessão inválida');

    let email = atual.email;
    if (dto.email !== undefined) {
      email = normalizeEmail(dto.email);
      if (email !== atual.email) {
        const existente = await this.prisma.usuario.findFirst({ where: { email, id: { not: id } } });
        if (existente) throw new ConflictException('Já existe uma conta com este e-mail');
      }
    }

    if (dto.nome !== undefined && !dto.nome.trim()) throw new BadRequestException('Nome é obrigatório');

    const senhaHash = dto.senha ? await bcrypt.hash(dto.senha, 10) : undefined;

    return this.prisma.usuario.update({
      where: { id },
      data: {
        nome: dto.nome !== undefined ? dto.nome.trim() : undefined,
        email,
        papel: dto.papel,
        status: dto.status,
        senhaHash,
      },
      select: USER_SELECT,
    });
  }

  async deletarUsuario(id: number, solicitanteId: number) {
    if (id === solicitanteId) throw new ForbiddenException('Você não pode excluir a própria conta');

    const atual = await this.prisma.usuario.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Usuário não encontrado');

    if (atual.papel === 'ADMIN') {
      const outrosAdmins = await this.prisma.usuario.count({ where: { papel: 'ADMIN', id: { not: id } } });
      if (outrosAdmins === 0) throw new ForbiddenException('Não é possível excluir o único administrador');
    }

    await this.prisma.usuario.delete({ where: { id } });
    return { id };
  }
}
