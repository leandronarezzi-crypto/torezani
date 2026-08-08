import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { TipoManutencao } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertManutencaoDto } from './dto/upsert-manutencao.dto';
import { RegistrarServicoDto } from './dto/registrar-servico.dto';
import { toNumber } from '../common/decimal';
import { computeManutencaoStatus } from '../common/alert-calculators';
import { PERIODOS, type PeriodoRelatorio } from '../embarcacoes/relatorio.service';
import type { AuthUser } from '../common/types/auth-user';

const TIPO_MANUTENCAO_LABEL: Record<TipoManutencao, string> = {
  PREVENTIVA: 'Preventiva',
  PREDITIVA: 'Preditiva',
  CORRETIVA: 'Corretiva',
};

/**
 * Chave de comparacao entre servicos: ignora acentos, maiusculas,
 * espacos duplicados e pontuacao final. "Troca de oleo " e "TROCA DE ÓLEO"
 * sao tratados como o mesmo servico.
 */
export function chaveServico(tipoServico: string): string {
  return String(tipoServico ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function annotate(
  m: {
    tipo: TipoManutencao;
    horimetroUltimaTroca: unknown;
    intervaloHoras: number | null;
    alertaLimiteHoras: number;
    [key: string]: unknown;
  },
  horimetroAtual: number,
) {
  const base = { ...m, horimetroUltimaTroca: toNumber(m.horimetroUltimaTroca as any) };

  // Corretiva e evento pontual (reparo ja feito): nao ha "proxima troca/inspecao" a acompanhar.
  // Preventiva e Preditiva sao recorrentes por intervalo de horas (troca vs. inspecao).
  if (m.tipo === 'CORRETIVA' || m.intervaloHoras == null) {
    return { ...base, proximaTroca: null, horasRestantes: null, status: 'N/A' as const };
  }

  const { proximaTroca, horasRestantes, status } = computeManutencaoStatus(
    horimetroAtual,
    Number(m.horimetroUltimaTroca),
    m.intervaloHoras,
    m.alertaLimiteHoras,
  );
  return { ...base, proximaTroca, horasRestantes, status };
}

@Injectable()
export class ManutencoesService implements OnModuleInit {
  private readonly logger = new Logger(ManutencoesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Na subida da API: garante que todo plano tenha o historico da sua ultima
   * troca e mescla cadastros duplicados. E idempotente — depois da primeira
   * execucao nao ha mais nada a fazer e o metodo sai em milissegundos.
   */
  async onModuleInit() {
    try {
      const resultado = await this.consolidarHistorico();
      if (resultado.execucoesCriadas || resultado.planosMesclados) {
        this.logger.log(
          `Consolidacao: ${resultado.execucoesCriadas} execucoes recuperadas, ${resultado.planosMesclados} cadastros duplicados mesclados.`,
        );
      }
    } catch (e) {
      // Nunca impedir a API de subir por causa da consolidacao.
      this.logger.error(`Falha na consolidacao de historico: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------

  /**
   * Cria uma manutencao no motor.
   *
   * PREVENTIVA/PREDITIVA: cria (ou reaproveita) um plano recorrente com intervalo de
   * horas — a diferenca entre as duas e so de rotulo (troca vs. inspecao), os dois
   * tem "proxima troca/inspecao" acompanhada pelo horimetro. Se ja existir o MESMO
   * servico do MESMO tipo no MESMO motor, nao cria duplicata: registra a troca
   * informada no plano existente.
   *
   * CORRETIVA: e um evento pontual (o cadastro ja E o registro do reparo feito) —
   * sempre gera uma linha de historico, e uma Despesa automatica se um custo for
   * informado.
   */
  async create(motorId: number, dto: UpsertManutencaoDto, usuario?: AuthUser) {
    const motor = await this.prisma.motor.findUnique({ where: { id: motorId } });
    if (!motor) throw new NotFoundException('Motor não encontrado');

    const horimetroMotor = toNumber(motor.horimetroAtual) ?? 0;
    const tipo = dto.tipo ?? 'PREVENTIVA';
    const chave = chaveServico(dto.tipoServico);

    const existentes = await this.prisma.manutencaoPreventiva.findMany({ where: { motorId } });
    const jaExiste = existentes.find((m) => chaveServico(m.tipoServico) === chave && m.tipo === tipo);

    if (tipo === 'CORRETIVA') {
      const horimetroEvento = dto.horimetroUltimaTroca ?? horimetroMotor;
      const manutencaoId = jaExiste
        ? jaExiste.id
        : (
            await this.prisma.manutencaoPreventiva.create({
              data: {
                motorId,
                tipo,
                tipoServico: dto.tipoServico.trim(),
                horimetroUltimaTroca: horimetroEvento,
                intervaloHoras: null,
                alertaLimiteHoras: 0,
              },
            })
          ).id;

      return this.registrarServico(
        manutencaoId,
        {
          horimetro: horimetroEvento,
          dataExecucao: dto.dataExecucao,
          observacoes: dto.observacoes,
          custo: dto.custo,
          fornecedor: dto.fornecedor,
        },
        usuario,
      );
    }

    if (jaExiste) {
      const novoHorimetro = dto.horimetroUltimaTroca ?? horimetroMotor;
      const anterior = toNumber(jaExiste.horimetroUltimaTroca) ?? 0;

      // So registra execucao se realmente avancou; senao apenas devolve o plano.
      if (novoHorimetro > anterior) {
        return this.registrarServico(jaExiste.id, { horimetro: novoHorimetro }, usuario);
      }
      return annotate(jaExiste, horimetroMotor);
    }

    if (dto.intervaloHoras == null) {
      throw new BadRequestException('intervaloHoras é obrigatório para manutenção Preventiva/Preditiva');
    }

    const manutencao = await this.prisma.manutencaoPreventiva.create({
      data: {
        motorId,
        tipo,
        tipoServico: dto.tipoServico.trim(),
        horimetroUltimaTroca: dto.horimetroUltimaTroca ?? 0,
        intervaloHoras: dto.intervaloHoras,
        alertaLimiteHoras: dto.alertaLimiteHoras ?? 0,
      },
    });

    // O cadastro inicial ja e um marco do historico.
    const inicial = toNumber(manutencao.horimetroUltimaTroca) ?? 0;
    if (inicial > 0) {
      await this.prisma.execucaoManutencao.create({
        data: {
          manutencaoId: manutencao.id,
          horimetro: inicial,
          dataExecucao: new Date(),
          origem: 'CADASTRO',
          observacoes: 'Horímetro informado no cadastro do plano de manutenção.',
          registradoPorId: usuario?.id ?? null,
          registradoPorNome: usuario?.nome ?? null,
        },
      });
    }

    return annotate(manutencao, horimetroMotor);
  }

  async update(id: number, dto: UpsertManutencaoDto) {
    const existing = await this.prisma.manutencaoPreventiva.findUnique({ where: { id }, include: { motor: true } });
    if (!existing) throw new NotFoundException('Manutenção não encontrada');

    const tipo = dto.tipo ?? existing.tipo;
    if (tipo !== 'CORRETIVA' && dto.intervaloHoras == null && existing.intervaloHoras == null) {
      throw new BadRequestException('intervaloHoras é obrigatório para manutenção Preventiva/Preditiva');
    }

    const manutencao = await this.prisma.manutencaoPreventiva.update({
      where: { id },
      data: {
        tipo,
        tipoServico: dto.tipoServico.trim(),
        horimetroUltimaTroca: dto.horimetroUltimaTroca ?? 0,
        intervaloHoras: tipo !== 'CORRETIVA' ? (dto.intervaloHoras ?? existing.intervaloHoras) : null,
        alertaLimiteHoras: dto.alertaLimiteHoras ?? 0,
      },
    });
    return annotate(manutencao, toNumber(existing.motor.horimetroAtual) ?? 0);
  }

  async remove(id: number) {
    const exists = await this.prisma.manutencaoPreventiva.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Manutenção não encontrada');
    await this.prisma.manutencaoPreventiva.delete({ where: { id } });
  }

  /**
   * Registra a execucao do servico. O historico e PRESERVADO: cria uma linha
   * em execucao_manutencao antes de atualizar o horimetro do plano.
   *
   * Se a manutencao for Preditiva/Corretiva e um custo for informado, gera
   * uma Despesa automaticamente (categoria Motor, vinculada a embarcacao) —
   * sem precisar de lancamento manual duplicado no Financeiro.
   */
  async registrarServico(id: number, dto: RegistrarServicoDto, usuario?: AuthUser) {
    const manutencao = await this.prisma.manutencaoPreventiva.findUnique({ where: { id }, include: { motor: true } });
    if (!manutencao) throw new NotFoundException('Manutenção não encontrada');

    const horimetroAtual = toNumber(manutencao.motor.horimetroAtual) ?? 0;
    const novoValor = dto.horimetro ?? horimetroAtual;
    const dataExecucao = dto.dataExecucao ? new Date(dto.dataExecucao) : new Date();

    const atualizada = await this.prisma.$transaction(async (tx) => {
      const execucao = await tx.execucaoManutencao.create({
        data: {
          manutencaoId: id,
          horimetro: novoValor,
          dataExecucao,
          observacoes: dto.observacoes?.trim() || null,
          origem: 'REGISTRO',
          registradoPorId: usuario?.id ?? null,
          registradoPorNome: usuario?.nome ?? null,
          custo: dto.custo ?? null,
          fornecedor: dto.fornecedor?.trim() || null,
        },
      });

      if (manutencao.tipo !== 'PREVENTIVA' && dto.custo != null && dto.custo > 0) {
        const despesa = await tx.despesa.create({
          data: {
            categoria: 'MOTOR',
            embarcacaoId: manutencao.motor.embarcacaoId,
            fornecedor: dto.fornecedor?.trim() || null,
            valor: dto.custo,
            data: dataExecucao,
            observacoes: `Gerada automaticamente pela manutenção ${TIPO_MANUTENCAO_LABEL[manutencao.tipo]}: ${manutencao.tipoServico}.`,
          },
        });
        await tx.execucaoManutencao.update({ where: { id: execucao.id }, data: { despesaId: despesa.id } });
      }

      return tx.manutencaoPreventiva.update({
        where: { id },
        data: { horimetroUltimaTroca: novoValor },
      });
    });

    return annotate(atualizada, horimetroAtual);
  }

  /** Historico completo de um plano, do mais recente para o mais antigo. */
  async listarHistorico(id: number) {
    const manutencao = await this.prisma.manutencaoPreventiva.findUnique({ where: { id } });
    if (!manutencao) throw new NotFoundException('Manutenção não encontrada');

    const execucoes = await this.prisma.execucaoManutencao.findMany({
      where: { manutencaoId: id },
      orderBy: [{ dataExecucao: 'desc' }, { id: 'desc' }],
    });
    return execucoes.map((e) => ({ ...e, horimetro: toNumber(e.horimetro), custo: toNumber(e.custo) }));
  }

  // ------------------------------------------------------------------
  // Dashboard da frota (Preventiva / Preditiva / Corretiva)
  // ------------------------------------------------------------------

  /**
   * Visao consolidada de manutencao de TODA a frota, para o dashboard e o
   * relatorio imprimivel. "vencidos" e sempre o estado ATUAL (independente do
   * periodo escolhido) — um item vencido nao pode sumir do relatorio so
   * porque a ultima execucao dele foi ha mais tempo que o periodo selecionado.
   * "itens" (o que foi feito) ja vem filtrado pelas execucoes do periodo.
   */
  async dashboardFrota(periodo: PeriodoRelatorio = '12m') {
    const config = PERIODOS[periodo];
    if (!config) {
      throw new BadRequestException(`Período inválido. Use: ${Object.keys(PERIODOS).join(', ')}`);
    }

    const fim = new Date();
    const inicio = config.meses ? new Date(new Date().setMonth(fim.getMonth() - config.meses)) : new Date(0);
    const noPeriodo = { gte: inicio, lte: fim };

    const manutencoes = await this.prisma.manutencaoPreventiva.findMany({
      where: { motor: { embarcacao: { excluidoEm: null } } },
      include: {
        motor: { include: { embarcacao: true } },
        execucoes: { where: { dataExecucao: noPeriodo }, orderBy: [{ dataExecucao: 'desc' }, { id: 'desc' }] },
      },
      orderBy: { id: 'asc' },
    });

    const porTipo: Record<TipoManutencao, { servicos: number; custo: number }> = {
      PREVENTIVA: { servicos: 0, custo: 0 },
      PREDITIVA: { servicos: 0, custo: 0 },
      CORRETIVA: { servicos: 0, custo: 0 },
    };
    const vencidos: Array<{
      embarcacaoId: number;
      embarcacaoNome: string;
      motorPosicao: string;
      manutencaoId: number;
      tipo: TipoManutencao;
      tipoServico: string;
      horasRestantes: number | null;
    }> = [];
    let manutencoesEmAlerta = 0;

    const todosItens = manutencoes.map((m) => {
      const horimetroAtual = toNumber(m.motor.horimetroAtual) ?? 0;
      const statusInfo =
        m.tipo !== 'CORRETIVA' && m.intervaloHoras != null
          ? computeManutencaoStatus(horimetroAtual, Number(m.horimetroUltimaTroca), m.intervaloHoras, m.alertaLimiteHoras)
          : { proximaTroca: null as number | null, horasRestantes: null as number | null, status: 'N/A' as const };

      for (const e of m.execucoes) {
        porTipo[m.tipo].servicos += 1;
        porTipo[m.tipo].custo += toNumber(e.custo) ?? 0;
      }

      if (statusInfo.status === 'VENCIDO') {
        vencidos.push({
          embarcacaoId: m.motor.embarcacaoId,
          embarcacaoNome: m.motor.embarcacao.nome,
          motorPosicao: m.motor.posicao,
          manutencaoId: m.id,
          tipo: m.tipo,
          tipoServico: m.tipoServico,
          horasRestantes: statusInfo.horasRestantes,
        });
      }
      if (statusInfo.status === 'ALERTA') manutencoesEmAlerta++;

      return {
        id: m.id,
        tipo: m.tipo,
        tipoServico: m.tipoServico,
        embarcacaoId: m.motor.embarcacaoId,
        embarcacaoNome: m.motor.embarcacao.nome,
        motorPosicao: m.motor.posicao,
        status: statusInfo.status,
        horasRestantes: statusInfo.horasRestantes,
        execucoes: m.execucoes.map((e) => ({
          id: e.id,
          dataExecucao: e.dataExecucao,
          horimetro: toNumber(e.horimetro),
          observacoes: e.observacoes,
          custo: toNumber(e.custo),
          fornecedor: e.fornecedor,
          registradoPor: e.registradoPorNome,
        })),
      };
    });

    vencidos.sort((a, b) => (a.horasRestantes ?? 0) - (b.horasRestantes ?? 0));
    const itens = todosItens.filter((item) => item.execucoes.length > 0);

    return {
      geradoEm: new Date(),
      periodo: { chave: periodo, label: config.label, inicio: config.meses ? inicio : null, fim },
      resumo: {
        totalEmbarcacoes: new Set(manutencoes.map((m) => m.motor.embarcacaoId)).size,
        totalPlanos: manutencoes.length,
        porTipo,
        custoTotalPeriodo: porTipo.PREVENTIVA.custo + porTipo.PREDITIVA.custo + porTipo.CORRETIVA.custo,
        manutencoesVencidas: vencidos.length,
        manutencoesEmAlerta,
      },
      vencidos,
      itens,
    };
  }

  // ------------------------------------------------------------------
  // Consolidacao (mesclagem de duplicatas + resgate de historico)
  // ------------------------------------------------------------------

  /**
   * 1. Garante uma linha de historico para a ultima troca de cada plano.
   * 2. Mescla planos duplicados (mesmo motor + mesmo servico + mesmo tipo): mantem o de
   *    horimetro mais alto e converte os demais em linhas de historico.
   *
   * Nenhuma informacao e perdida: o horimetro do plano removido vira execucao.
   */
  async consolidarHistorico(): Promise<{ execucoesCriadas: number; planosMesclados: number }> {
    let execucoesCriadas = 0;
    let planosMesclados = 0;

    const planos = await this.prisma.manutencaoPreventiva.findMany({
      include: { execucoes: { select: { id: true, horimetro: true } } },
      orderBy: { id: 'asc' },
    });

    // Passo 1 — resgatar o horimetro atual de cada plano como historico.
    for (const plano of planos) {
      const ultima = toNumber(plano.horimetroUltimaTroca) ?? 0;
      if (ultima <= 0) continue;
      const jaRegistrada = plano.execucoes.some((e) => (toNumber(e.horimetro) ?? -1) === ultima);
      if (jaRegistrada) continue;

      await this.prisma.execucaoManutencao.create({
        data: {
          manutencaoId: plano.id,
          horimetro: ultima,
          dataExecucao: plano.atualizadoEm ?? plano.criadoEm ?? new Date(),
          origem: 'MESCLAGEM',
          observacoes: 'Registro recuperado automaticamente do cadastro existente.',
        },
      });
      execucoesCriadas++;
    }

    // Passo 2 — mesclar duplicatas (mesmo motor, mesmo servico E mesmo tipo).
    const grupos = new Map<string, typeof planos>();
    for (const plano of planos) {
      const chave = `${plano.motorId}::${plano.tipo}::${chaveServico(plano.tipoServico)}`;
      const lista = grupos.get(chave) ?? [];
      lista.push(plano);
      grupos.set(chave, lista);
    }

    for (const lista of grupos.values()) {
      if (lista.length < 2) continue;

      // Mantem o plano com maior horimetro de ultima troca (o mais atual).
      const ordenados = [...lista].sort(
        (a, b) => (toNumber(b.horimetroUltimaTroca) ?? 0) - (toNumber(a.horimetroUltimaTroca) ?? 0) || b.id - a.id,
      );
      const principal = ordenados[0];
      const duplicados = ordenados.slice(1);

      for (const dup of duplicados) {
        await this.prisma.$transaction(async (tx) => {
          // Todo o historico do duplicado passa para o plano principal.
          await tx.execucaoManutencao.updateMany({
            where: { manutencaoId: dup.id },
            data: { manutencaoId: principal.id },
          });
          await tx.manutencaoPreventiva.delete({ where: { id: dup.id } });
        });
        planosMesclados++;
      }
    }

    return { execucoesCriadas, planosMesclados };
  }
}
