import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registrar(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);

    const existente = await this.prisma.usuario.findUnique({ where: { email } });
    if (existente) throw new ConflictException('Já existe uma conta com este e-mail');

    const total = await this.prisma.usuario.count();
    const isPrimeiroUsuario = total === 0;

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dto.nome.trim(),
        email,
        senhaHash,
        papel: isPrimeiroUsuario ? 'ADMIN' : 'VISUALIZADOR',
        status: isPrimeiroUsuario ? 'APROVADO' : 'PENDENTE',
      },
      select: USER_SELECT,
    });
    return usuario;
  }

  async autenticar(dto: LoginDto) {
    const email = normalizeEmail(dto.email);
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario) throw new UnauthorizedException('E-mail ou senha inválidos');

    const senhaOk = await bcrypt.compare(dto.senha, usuario.senhaHash);
    if (!senhaOk) throw new UnauthorizedException('E-mail ou senha inválidos');

    if (usuario.status === 'PENDENTE') throw new ForbiddenException('Sua conta ainda não foi liberada pelo administrador');
    if (usuario.status === 'REJEITADO') throw new ForbiddenException('Seu acesso foi recusado pelo administrador');

    const accessToken = this.jwt.sign({ sub: usuario.id });
    return {
      accessToken,
      userId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      status: usuario.status,
    };
  }
}
