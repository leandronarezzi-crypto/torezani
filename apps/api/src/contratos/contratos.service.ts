import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { toNumber } from '../common/decimal';

const SOMENTE_ATIVOS = { excluidoEm: null } as const;

function serialize(contrato: { valor: unknown; [key: string]: unknown }) {
  return { ...contrato, valor: toNumber(contrato.valor as any) };
}

@Injectable()
export class ContratosService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarCliente(clienteId: number) {
    const cliente = await this.prisma.cliente.findFirst({ where: { id: clienteId, excluidoEm: null } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
  }

  async list(clienteId?: number) {
    const contratos = await this.prisma.contrato.findMany({
      where: { ...SOMENTE_ATIVOS, ...(clienteId ? { clienteId } : {}) },
      include: { cliente: true },
      orderBy: { criadoEm: 'desc' },
    });
    return contratos.map(serialize);
  }

  async get(id: number) {
    const contrato = await this.prisma.contrato.findFirst({ where: { id, ...SOMENTE_ATIVOS }, include: { cliente: true } });
    if (!contrato) throw new NotFoundException('Contrato não encontrado');
    return serialize(contrato);
  }

  async create(dto: CreateContratoDto) {
    await this.validarCliente(dto.clienteId);
    const contrato = await this.prisma.contrato.create({
      data: {
        clienteId: dto.clienteId,
        numero: dto.numero?.trim() || null,
        descricao: dto.descricao?.trim() || null,
        valor: dto.valor ?? null,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : null,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : null,
        status: dto.status ?? 'ATIVO',
        observacoes: dto.observacoes?.trim() || null,
      },
    });
    return serialize(contrato);
  }

  async update(id: number, dto: UpdateContratoDto) {
    await this.get(id);
    await this.validarCliente(dto.clienteId);
    const contrato = await this.prisma.contrato.update({
      where: { id },
      data: {
        clienteId: dto.clienteId,
        numero: dto.numero?.trim() || null,
        descricao: dto.descricao?.trim() || null,
        valor: dto.valor ?? null,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : null,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : null,
        status: dto.status,
        observacoes: dto.observacoes?.trim() || null,
      },
    });
    return serialize(contrato);
  }

  /** Exclusao logica. Receitas vinculadas ao contrato permanecem intactas. */
  async remove(id: number) {
    await this.get(id);
    await this.prisma.contrato.update({ where: { id }, data: { excluidoEm: new Date() } });
  }

  async listExcluidos() {
    const contratos = await this.prisma.contrato.findMany({
      where: { excluidoEm: { not: null } },
      include: { cliente: true },
      orderBy: { excluidoEm: 'desc' },
    });
    return contratos.map(serialize);
  }

  async restaurar(id: number) {
    const contrato = await this.prisma.contrato.findUnique({ where: { id } });
    if (!contrato) throw new NotFoundException('Contrato não encontrado');
    if (!contrato.excluidoEm) throw new ConflictException('Este contrato não está excluído');
    const restaurado = await this.prisma.contrato.update({ where: { id }, data: { excluidoEm: null } });
    return serialize(restaurado);
  }
}
