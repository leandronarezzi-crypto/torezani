import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertManutencaoDto } from './dto/upsert-manutencao.dto';
import { RegistrarServicoDto } from './dto/registrar-servico.dto';
import { toNumber } from '../common/decimal';
import { computeManutencaoStatus } from '../common/alert-calculators';
import type { AuthUser } from '../common/types/auth-user';

/**
 * Chave de comparacao entre servicos: ignora acentos, maiusculas,
 * espacos duplicados e pontuacao final. "Troca de oleo " e "TROCA DE ÓLEO"
 * sao tratados como o mesmo servico.
 */
export function chaveServico(tipoServico: string): string {
  return String(tipoServico ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function annotate(
  m: { horimetroUltimaTroca: unknown; intervaloHoras: number; alertaLimiteHoras: number; [key: string]: unknown },
  horimetroAtual: number,
) {
  const { proximaTroca, horasRestantes, status } = computeManutencaoStatus(
    horimetroAtual,
    Number(m.horimetroUltimaTroca),
    m.intervaloHoras,
    m.alertaLimiteHoras,
  );
  return { ...m, horimetroUltimaTroca: toNumber(m.horimetroUltimaTroca as any), proximaTroca, horasRestantes, status };
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
   * Cria um plano de manutencao. Se ja existir o MESMO servico no MESMO motor,
   * nao cria duplicata: registra a troca informada no plano existente.
   */
  async create(motorId: number, dto: UpsertManutencaoDto, usuario?: AuthUser) {
    const motor = await this.prisma.motor.findUnique({ where: { id: motorId } });
    if (!motor) throw new NotFoundException('Motor não encontrado');

    const horimetroMotor = toNumber(motor.horimetroAtual) ?? 0;
    const chave = chaveServico(dto.tipoServico);

    const existentes = await this.prisma.manutencaoPreventiva.findMany({ where: { motorId } });
    const jaExiste = existentes.find((m) => chaveServico(m.tipoServico) === chave);

    if (jaExiste) {
      const novoHorimetro = dto.horimetroUltimaTroca ?? horimetroMotor;
      const anterior = toNumber(jaExiste.horimetroUltimaTroca) ?? 0;

      // So registra execucao se realmente avancou; senao apenas devolve o plano.
      if (novoHorimetro > anterior) {
        return this.registrarServico(jaExiste.id, { horimetro: novoHorimetro }, usuario);
      }
      return annotate(jaExiste, horimetroMotor);
    }

    const manutencao = await this.prisma.manutencaoPreventiva.create({
      data: {
        motorId,
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

    const manutencao = await this.prisma.manutencaoPreventiva.update({
      where: { id },
      data: {
        tipoServico: dto.tipoServico.trim(),
        horimetroUltimaTroca: dto.horimetroUltimaTroca ?? 0,
        intervaloHoras: dto.intervaloHoras,
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
   */
  async registrarServico(id: number, dto: RegistrarServicoDto, usuario?: AuthUser) {
    const manutencao = await this.prisma.manutencaoPreventiva.findUnique({ where: { id }, include: { motor: true } });
    if (!manutencao) throw new NotFoundException('Manutenção não encontrada');

    const horimetroAtual = toNumber(manutencao.motor.horimetroAtual) ?? 0;
    const novoValor = dto.horimetro ?? horimetroAtual;

    const atualizada = await this.prisma.$transaction(async (tx) => {
      await tx.execucaoManutencao.create({
        data: {
          manutencaoId: id,
          horimetro: novoValor,
          dataExecucao: dto.dataExecucao ? new Date(dto.dataExecucao) : new Date(),
          observacoes: dto.observacoes?.trim() || null,
          origem: 'REGISTRO',
          registradoPorId: usuario?.id ?? null,
          registradoPorNome: usuario?.nome ?? null,
        },
      });
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
    return execucoes.map((e) => ({ ...e, horimetro: toNumber(e.horimetro) }));
  }

  // ------------------------------------------------------------------
  // Consolidacao (mesclagem de duplicatas + resgate de historico)
  // ------------------------------------------------------------------

  /**
   * 1. Garante uma linha de historico para a ultima troca de cada plano.
   * 2. Mescla planos duplicados (mesmo motor + mesmo servico): mantem o de
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

    // Passo 2 — mesclar duplicatas.
    const grupos = new Map<string, typeof planos>();
    for (const plano of planos) {
      const chave = `${plano.motorId}::${chaveServico(plano.tipoServico)}`;
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
