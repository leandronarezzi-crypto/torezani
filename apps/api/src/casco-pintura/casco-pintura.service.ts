import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCascoPinturaDto } from './dto/upsert-casco-pintura.dto';
import { toNumber } from '../common/decimal';
import { computeCascoPinturaStatus } from '../common/alert-calculators';

function annotate(row: { alertaVencimentoData: Date | null; horimetroEmbarcacao: unknown; [key: string]: unknown }) {
  const { diasRestantes, status } = computeCascoPinturaStatus(row.alertaVencimentoData);
  return { ...row, horimetroEmbarcacao: toNumber(row.horimetroEmbarcacao as any), diasRestantes, status };
}

@Injectable()
export class CascoPinturaService {
  constructor(private readonly prisma: PrismaService) {}

  async listByEmbarcacaoId(embarcacaoId: number) {
    const rows = await this.prisma.manutencaoCascoPintura.findMany({
      where: { embarcacaoId },
      orderBy: [{ dataExecucao: 'desc' }, { id: 'desc' }],
    });
    return rows.map(annotate);
  }

  async create(embarcacaoId: number, dto: UpsertCascoPinturaDto) {
    const embarcacao = await this.prisma.embarcacao.findUnique({ where: { id: embarcacaoId } });
    if (!embarcacao) throw new NotFoundException('Embarcação não encontrada');

    const row = await this.prisma.manutencaoCascoPintura.create({
      data: {
        embarcacaoId,
        tipoIntervencao: dto.tipoIntervencao,
        dataExecucao: dto.dataExecucao ? new Date(dto.dataExecucao) : null,
        horimetroEmbarcacao: dto.horimetroEmbarcacao ?? null,
        esquemaProdutos: dto.esquemaProdutos || null,
        historicoObservacoes: dto.historicoObservacoes || null,
        alertaVencimentoData: dto.alertaVencimentoData ? new Date(dto.alertaVencimentoData) : null,
      },
    });
    return annotate(row);
  }

  async update(id: number, dto: UpsertCascoPinturaDto) {
    const exists = await this.prisma.manutencaoCascoPintura.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Registro de casco/pintura não encontrado');

    const row = await this.prisma.manutencaoCascoPintura.update({
      where: { id },
      data: {
        tipoIntervencao: dto.tipoIntervencao,
        dataExecucao: dto.dataExecucao ? new Date(dto.dataExecucao) : null,
        horimetroEmbarcacao: dto.horimetroEmbarcacao ?? null,
        esquemaProdutos: dto.esquemaProdutos || null,
        historicoObservacoes: dto.historicoObservacoes || null,
        alertaVencimentoData: dto.alertaVencimentoData ? new Date(dto.alertaVencimentoData) : null,
      },
    });
    return annotate(row);
  }

  async remove(id: number) {
    const exists = await this.prisma.manutencaoCascoPintura.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Registro de casco/pintura não encontrado');
    await this.prisma.manutencaoCascoPintura.delete({ where: { id } });
  }
}
