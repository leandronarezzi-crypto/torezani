import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

/** Filtro padrao: so clientes ativos (nao excluidos). */
const SOMENTE_ATIVOS = { excluidoEm: null } as const;

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.cliente.findMany({ where: SOMENTE_ATIVOS, orderBy: { nome: 'asc' } });
  }

  async get(id: number) {
    const cliente = await this.prisma.cliente.findFirst({ where: { id, ...SOMENTE_ATIVOS } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async create(dto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: {
        nome: dto.nome.trim(),
        documento: dto.documento?.trim() || null,
        contatoNome: dto.contatoNome?.trim() || null,
        contatoEmail: dto.contatoEmail?.trim() || null,
        contatoTelefone: dto.contatoTelefone?.trim() || null,
        observacoes: dto.observacoes?.trim() || null,
      },
    });
  }

  async update(id: number, dto: UpdateClienteDto) {
    await this.get(id);
    return this.prisma.cliente.update({
      where: { id },
      data: {
        nome: dto.nome.trim(),
        documento: dto.documento?.trim() || null,
        contatoNome: dto.contatoNome?.trim() || null,
        contatoEmail: dto.contatoEmail?.trim() || null,
        contatoTelefone: dto.contatoTelefone?.trim() || null,
        observacoes: dto.observacoes?.trim() || null,
      },
    });
  }

  /** Exclusao logica. Contratos e receitas do cliente permanecem intactos. */
  async remove(id: number) {
    await this.get(id);
    await this.prisma.cliente.update({ where: { id }, data: { excluidoEm: new Date() } });
  }

  async listExcluidos() {
    return this.prisma.cliente.findMany({ where: { excluidoEm: { not: null } }, orderBy: { excluidoEm: 'desc' } });
  }

  async restaurar(id: number) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    if (!cliente.excluidoEm) throw new ConflictException('Este cliente não está excluído');
    return this.prisma.cliente.update({ where: { id }, data: { excluidoEm: null } });
  }
}
