import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusReceita } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';
import { toNumber } from '../common/decimal';

const SOMENTE_ATIVAS = { excluidoEm: null } as const;

export interface FiltroReceitas {
  clienteId?: number;
  contratoId?: number;
  embarcacaoId?: number;
  status?: StatusReceita;
  dataInicio?: string;
  dataFim?: string;
}

function serialize(receita: { valorContratado: unknown; valorFaturado: unknown; valorRecebido: unknown; [key: string]: unknown }) {
  return {
    ...receita,
    valorContratado: toNumber(receita.valorContratado as any),
    valorFaturado: toNumber(receita.valorFaturado as any),
    valorRecebido: toNumber(receita.valorRecebido as any),
  };
}

@Injectable()
export class ReceitasService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarReferencias(clienteId: number, contratoId?: number, embarcacaoId?: number) {
    const cliente = await this.prisma.cliente.findFirst({ where: { id: clienteId, excluidoEm: null } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    if (contratoId) {
      const contrato = await this.prisma.contrato.findFirst({ where: { id: contratoId, excluidoEm: null } });
      if (!contrato) throw new NotFoundException('Contrato não encontrado');
    }
    if (embarcacaoId) {
      const embarcacao = await this.prisma.embarcacao.findFirst({ where: { id: embarcacaoId, excluidoEm: null } });
      if (!embarcacao) throw new NotFoundException('Embarcação não encontrada');
    }
  }

  private montarFiltroData(dataInicio?: string, dataFim?: string): Prisma.DateTimeFilter | undefined {
    if (!dataInicio && !dataFim) return undefined;
    const filtro: Prisma.DateTimeFilter = {};
    if (dataInicio) filtro.gte = new Date(dataInicio);
    if (dataFim) filtro.lte = new Date(dataFim);
    return filtro;
  }

  async list(filtro: FiltroReceitas = {}) {
    const data = this.montarFiltroData(filtro.dataInicio, filtro.dataFim);
    const receitas = await this.prisma.receita.findMany({
      where: {
        ...SOMENTE_ATIVAS,
        ...(filtro.clienteId ? { clienteId: filtro.clienteId } : {}),
        ...(filtro.contratoId ? { contratoId: filtro.contratoId } : {}),
        ...(filtro.embarcacaoId ? { embarcacaoId: filtro.embarcacaoId } : {}),
        ...(filtro.status ? { status: filtro.status } : {}),
        ...(data ? { data } : {}),
      },
      include: { cliente: true, contrato: true, embarcacao: true },
      orderBy: { data: 'desc' },
    });
    return receitas.map(serialize);
  }

  async get(id: number) {
    const receita = await this.prisma.receita.findFirst({
      where: { id, ...SOMENTE_ATIVAS },
      include: { cliente: true, contrato: true, embarcacao: true },
    });
    if (!receita) throw new NotFoundException('Receita não encontrada');
    return serialize(receita);
  }

  async create(dto: CreateReceitaDto) {
    await this.validarReferencias(dto.clienteId, dto.contratoId, dto.embarcacaoId);
    const receita = await this.prisma.receita.create({
      data: {
        clienteId: dto.clienteId,
        contratoId: dto.contratoId ?? null,
        embarcacaoId: dto.embarcacaoId ?? null,
        tipoServico: dto.tipoServico?.trim() || null,
        valorContratado: dto.valorContratado ?? null,
        valorFaturado: dto.valorFaturado ?? null,
        valorRecebido: dto.valorRecebido ?? null,
        data: new Date(dto.data),
        status: dto.status ?? 'PENDENTE',
        observacoes: dto.observacoes?.trim() || null,
      },
    });
    return serialize(receita);
  }

  async update(id: number, dto: UpdateReceitaDto) {
    await this.get(id);
    await this.validarReferencias(dto.clienteId, dto.contratoId, dto.embarcacaoId);
    const receita = await this.prisma.receita.update({
      where: { id },
      data: {
        clienteId: dto.clienteId,
        contratoId: dto.contratoId ?? null,
        embarcacaoId: dto.embarcacaoId ?? null,
        tipoServico: dto.tipoServico?.trim() || null,
        valorContratado: dto.valorContratado ?? null,
        valorFaturado: dto.valorFaturado ?? null,
        valorRecebido: dto.valorRecebido ?? null,
        data: new Date(dto.data),
        status: dto.status,
        observacoes: dto.observacoes?.trim() || null,
      },
    });
    return serialize(receita);
  }

  async remove(id: number) {
    await this.get(id);
    await this.prisma.receita.update({ where: { id }, data: { excluidoEm: new Date() } });
  }

  async listExcluidas() {
    const receitas = await this.prisma.receita.findMany({
      where: { excluidoEm: { not: null } },
      include: { cliente: true, contrato: true, embarcacao: true },
      orderBy: { excluidoEm: 'desc' },
    });
    return receitas.map(serialize);
  }

  async restaurar(id: number) {
    const receita = await this.prisma.receita.findUnique({ where: { id } });
    if (!receita) throw new NotFoundException('Receita não encontrada');
    if (!receita.excluidoEm) throw new ConflictException('Esta receita não está excluída');
    const restaurada = await this.prisma.receita.update({ where: { id }, data: { excluidoEm: null } });
    return serialize(restaurada);
  }
}
