import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, CategoriaDespesa } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { toNumber } from '../common/decimal';

const SOMENTE_ATIVAS = { excluidoEm: null } as const;

export interface FiltroDespesas {
  embarcacaoId?: number;
  categoria?: CategoriaDespesa;
  centroCustoId?: number;
  dataInicio?: string;
  dataFim?: string;
}

function serialize(despesa: { valor: unknown; [key: string]: unknown }) {
  return { ...despesa, valor: toNumber(despesa.valor as any) };
}

@Injectable()
export class DespesasService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarReferencias(embarcacaoId?: number, centroCustoId?: number) {
    if (embarcacaoId) {
      const embarcacao = await this.prisma.embarcacao.findFirst({ where: { id: embarcacaoId, excluidoEm: null } });
      if (!embarcacao) throw new NotFoundException('Embarcação não encontrada');
    }
    if (centroCustoId) {
      const centro = await this.prisma.centroCusto.findUnique({ where: { id: centroCustoId } });
      if (!centro) throw new NotFoundException('Centro de custo não encontrado');
    }
  }

  private montarFiltroData(dataInicio?: string, dataFim?: string): Prisma.DateTimeFilter | undefined {
    if (!dataInicio && !dataFim) return undefined;
    const filtro: Prisma.DateTimeFilter = {};
    if (dataInicio) filtro.gte = new Date(dataInicio);
    if (dataFim) filtro.lte = new Date(dataFim);
    return filtro;
  }

  async list(filtro: FiltroDespesas = {}) {
    const data = this.montarFiltroData(filtro.dataInicio, filtro.dataFim);
    const despesas = await this.prisma.despesa.findMany({
      where: {
        ...SOMENTE_ATIVAS,
        ...(filtro.embarcacaoId ? { embarcacaoId: filtro.embarcacaoId } : {}),
        ...(filtro.categoria ? { categoria: filtro.categoria } : {}),
        ...(filtro.centroCustoId ? { centroCustoId: filtro.centroCustoId } : {}),
        ...(data ? { data } : {}),
      },
      include: { embarcacao: true, centroCusto: true },
      orderBy: { data: 'desc' },
    });
    return despesas.map(serialize);
  }

  async get(id: number) {
    const despesa = await this.prisma.despesa.findFirst({
      where: { id, ...SOMENTE_ATIVAS },
      include: { embarcacao: true, centroCusto: true },
    });
    if (!despesa) throw new NotFoundException('Despesa não encontrada');
    return serialize(despesa);
  }

  async create(dto: CreateDespesaDto) {
    await this.validarReferencias(dto.embarcacaoId, dto.centroCustoId);
    const despesa = await this.prisma.despesa.create({
      data: {
        categoria: dto.categoria,
        subcategoria: dto.subcategoria?.trim() || null,
        embarcacaoId: dto.embarcacaoId ?? null,
        centroCustoId: dto.centroCustoId ?? null,
        fornecedor: dto.fornecedor?.trim() || null,
        numeroNotaFiscal: dto.numeroNotaFiscal?.trim() || null,
        valor: dto.valor,
        data: new Date(dto.data),
        formaPagamento: dto.formaPagamento?.trim() || null,
        observacoes: dto.observacoes?.trim() || null,
      },
    });
    return serialize(despesa);
  }

  async update(id: number, dto: UpdateDespesaDto) {
    await this.get(id);
    await this.validarReferencias(dto.embarcacaoId, dto.centroCustoId);
    const despesa = await this.prisma.despesa.update({
      where: { id },
      data: {
        categoria: dto.categoria,
        subcategoria: dto.subcategoria?.trim() || null,
        embarcacaoId: dto.embarcacaoId ?? null,
        centroCustoId: dto.centroCustoId ?? null,
        fornecedor: dto.fornecedor?.trim() || null,
        numeroNotaFiscal: dto.numeroNotaFiscal?.trim() || null,
        valor: dto.valor,
        data: new Date(dto.data),
        formaPagamento: dto.formaPagamento?.trim() || null,
        observacoes: dto.observacoes?.trim() || null,
      },
    });
    return serialize(despesa);
  }

  async remove(id: number) {
    await this.get(id);
    await this.prisma.despesa.update({ where: { id }, data: { excluidoEm: new Date() } });
  }

  async listExcluidas() {
    const despesas = await this.prisma.despesa.findMany({
      where: { excluidoEm: { not: null } },
      include: { embarcacao: true, centroCusto: true },
      orderBy: { excluidoEm: 'desc' },
    });
    return despesas.map(serialize);
  }

  async restaurar(id: number) {
    const despesa = await this.prisma.despesa.findUnique({ where: { id } });
    if (!despesa) throw new NotFoundException('Despesa não encontrada');
    if (!despesa.excluidoEm) throw new ConflictException('Esta despesa não está excluída');
    const restaurada = await this.prisma.despesa.update({ where: { id }, data: { excluidoEm: null } });
    return serialize(restaurada);
  }
}
