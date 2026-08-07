import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/decimal';
import { computeCascoPinturaStatus, computeManutencaoStatus } from '../common/alert-calculators';

export const PERIODOS = {
  '3m': { meses: 3, label: 'Últimos 3 meses' },
  '6m': { meses: 6, label: 'Últimos 6 meses' },
  '12m': { meses: 12, label: 'Últimos 12 meses (anual)' },
  '60m': { meses: 60, label: 'Últimos 5 anos (quinquenal)' },
  tudo: { meses: 0, label: 'Histórico completo' },
} as const;

export type PeriodoRelatorio = keyof typeof PERIODOS;

const POSICAO_LABEL: Record<string, string> = {
  MONO: 'Mono',
  BORE_BABOR: 'Bore/Babor',
  ESTIBORDO: 'Estibordo',
};

@Injectable()
export class RelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  async gerar(embarcacaoId: number, periodo: PeriodoRelatorio = '12m') {
    const config = PERIODOS[periodo];
    if (!config) {
      throw new BadRequestException(`Período inválido. Use: ${Object.keys(PERIODOS).join(', ')}`);
    }

    const embarcacao = await this.prisma.embarcacao.findFirst({
      where: { id: embarcacaoId, excluidoEm: null },
    });
    if (!embarcacao) throw new NotFoundException('Embarcação não encontrada');

    const fim = new Date();
    const inicio = config.meses ? new Date(new Date().setMonth(fim.getMonth() - config.meses)) : new Date(0);
    const noPeriodo = { gte: inicio, lte: fim };

    const motores = await this.prisma.motor.findMany({
      where: { embarcacaoId },
      include: {
        caixaReversora: true,
        sistemaEixoHelice: true,
        correias: { orderBy: { id: 'asc' } },
        manutencoes: {
          orderBy: { id: 'asc' },
          include: {
            execucoes: {
              where: { dataExecucao: noPeriodo },
              orderBy: [{ dataExecucao: 'desc' }, { id: 'desc' }],
            },
          },
        },
      },
    });

    let totalExecucoes = 0;
    let totalVencidas = 0;
    let totalAlerta = 0;

    const motoresRelatorio = motores.map((motor) => {
      const horimetroAtual = toNumber(motor.horimetroAtual) ?? 0;

      const manutencoes = motor.manutencoes.map((m) => {
        const calc = computeManutencaoStatus(
          horimetroAtual,
          Number(m.horimetroUltimaTroca),
          m.intervaloHoras,
          m.alertaLimiteHoras,
        );
        if (calc.status === 'VENCIDO') totalVencidas++;
        if (calc.status === 'ALERTA') totalAlerta++;
        totalExecucoes += m.execucoes.length;

        return {
          id: m.id,
          tipoServico: m.tipoServico,
          intervaloHoras: m.intervaloHoras,
          alertaLimiteHoras: m.alertaLimiteHoras,
          horimetroUltimaTroca: toNumber(m.horimetroUltimaTroca),
          proximaTroca: calc.proximaTroca,
          horasRestantes: calc.horasRestantes,
          status: calc.status,
          execucoes: m.execucoes.map((e) => ({
            id: e.id,
            dataExecucao: e.dataExecucao,
            horimetro: toNumber(e.horimetro),
            observacoes: e.observacoes,
            origem: e.origem,
            registradoPor: e.registradoPorNome,
          })),
        };
      });

      return {
        id: motor.id,
        posicao: motor.posicao,
        posicaoLabel: POSICAO_LABEL[motor.posicao] ?? motor.posicao,
        marca: motor.marca,
        modelo: motor.modelo,
        potenciaConfig: motor.potenciaConfig,
        numSerie: motor.numSerie,
        horimetroAtual,
        caixaReversora: motor.caixaReversora,
        sistemaEixoHelice: motor.sistemaEixoHelice,
        correias: motor.correias,
        manutencoes,
      };
    });

    const cascoPinturaRows = await this.prisma.manutencaoCascoPintura.findMany({
      where: { embarcacaoId, dataExecucao: noPeriodo },
      orderBy: { dataExecucao: 'desc' },
    });

    const cascoPintura = cascoPinturaRows.map((c) => ({
      id: c.id,
      tipoIntervencao: c.tipoIntervencao,
      dataExecucao: c.dataExecucao,
      horimetroEmbarcacao: toNumber(c.horimetroEmbarcacao),
      esquemaProdutos: c.esquemaProdutos,
      historicoObservacoes: c.historicoObservacoes,
      alertaVencimentoData: c.alertaVencimentoData,
      ...computeCascoPinturaStatus(c.alertaVencimentoData),
    }));

    const auditorias = await this.prisma.auditoria.findMany({
      where: { embarcacaoId, dataRealizacao: noPeriodo },
      orderBy: { dataRealizacao: 'desc' },
      include: { itens: { orderBy: { ordem: 'asc' } } },
    });

    return {
      geradoEm: new Date(),
      periodo: { chave: periodo, label: config.label, inicio: config.meses ? inicio : null, fim },
      embarcacao: {
        id: embarcacao.id,
        nome: embarcacao.nome,
        tipoConfiguracao: embarcacao.tipoConfiguracao,
        latitude: toNumber(embarcacao.latitude),
        longitude: toNumber(embarcacao.longitude),
        localizacaoAtualizadaEm: embarcacao.localizacaoAtualizadaEm,
      },
      resumo: {
        totalMotores: motoresRelatorio.length,
        totalPlanos: motoresRelatorio.reduce((s, m) => s + m.manutencoes.length, 0),
        manutencoesVencidas: totalVencidas,
        manutencoesEmAlerta: totalAlerta,
        servicosExecutadosNoPeriodo: totalExecucoes,
        intervencoesCascoPintura: cascoPintura.length,
        auditoriasRealizadas: auditorias.length,
      },
      motores: motoresRelatorio,
      cascoPintura,
      auditorias: auditorias.map((a) => ({
        id: a.id,
        responsavel: a.responsavel,
        dataRealizacao: a.dataRealizacao,
        horimetro: toNumber(a.horimetro),
        observacoesGerais: a.observacoesGerais,
        itens: a.itens,
        totalItens: a.itens.length,
        itensConcluidos: a.itens.filter((i) => i.concluido).length,
      })),
    };
  }
}
