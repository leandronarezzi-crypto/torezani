import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/decimal';
import { computeCascoPinturaStatus, computeManutencaoStatus, StatusAlerta } from '../common/alert-calculators';

const POSICAO_LABEL: Record<string, string> = {
  MONO: 'Mono',
  BORE_BABOR: 'Bore/Babor',
  ESTIBORDO: 'Estibordo',
};

interface ManutencaoAlerta {
  embarcacaoId: number;
  embarcacaoNome: string;
  motorId: number;
  motorPosicao: string;
  manutencaoId: number;
  tipoServico: string;
  proximaTroca: number;
  horasRestantes: number;
  status: StatusAlerta;
}

interface CascoPinturaAlerta {
  embarcacaoId: number;
  embarcacaoNome: string;
  cascoPinturaId: number;
  tipoIntervencao: string;
  diasRestantes: number | null;
  status: StatusAlerta;
}

export interface NotificationEvent {
  id: string;
  type: 'MANUTENCAO' | 'CASCO_PINTURA';
  important: boolean;
  title: string;
  description: string;
  link: { label: string; href: string };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAlertas(): Promise<{ resumo: Record<string, number>; manutencoes: ManutencaoAlerta[]; cascoPintura: CascoPinturaAlerta[] }> {
    // Embarcacoes excluidas (exclusao logica) nao geram alerta nem notificacao.
    const manutencaoRows = await this.prisma.manutencaoPreventiva.findMany({
      // Corretiva e evento pontual ja resolvido: nao entra no calculo de vencimento.
      // Preventiva e Preditiva sao recorrentes (troca/inspecao) e podem vencer.
      where: { tipo: { not: 'CORRETIVA' }, motor: { embarcacao: { excluidoEm: null } } },
      include: { motor: { include: { embarcacao: true } } },
    });

    const manutencoes = manutencaoRows
      .map((row) => {
        const horimetroAtual = toNumber(row.motor.horimetroAtual) ?? 0;
        const { proximaTroca, horasRestantes, status } = computeManutencaoStatus(
          horimetroAtual,
          Number(row.horimetroUltimaTroca),
          Number(row.intervaloHoras),
          row.alertaLimiteHoras,
        );
        return {
          embarcacaoId: row.motor.embarcacaoId,
          embarcacaoNome: row.motor.embarcacao.nome,
          motorId: row.motorId,
          motorPosicao: row.motor.posicao,
          manutencaoId: row.id,
          tipoServico: row.tipoServico,
          proximaTroca,
          horasRestantes,
          status,
        };
      })
      .filter((item) => item.status !== 'OK')
      .sort((a, b) => a.horasRestantes - b.horasRestantes);

    const cascoPinturaRows = await this.prisma.manutencaoCascoPintura.findMany({
      where: { alertaVencimentoData: { not: null }, embarcacao: { excluidoEm: null } },
      include: { embarcacao: true },
    });

    const cascoPintura = cascoPinturaRows
      .map((row) => {
        const { diasRestantes, status } = computeCascoPinturaStatus(row.alertaVencimentoData);
        return {
          embarcacaoId: row.embarcacaoId,
          embarcacaoNome: row.embarcacao.nome,
          cascoPinturaId: row.id,
          tipoIntervencao: row.tipoIntervencao,
          diasRestantes,
          status,
        };
      })
      .filter((item) => item.status !== 'OK')
      .sort((a, b) => (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0));

    const resumo = {
      manutencaoVencida: manutencoes.filter((m) => m.status === 'VENCIDO').length,
      manutencaoAlerta: manutencoes.filter((m) => m.status === 'ALERTA').length,
      cascoPinturaVencido: cascoPintura.filter((c) => c.status === 'VENCIDO').length,
      cascoPinturaAlerta: cascoPintura.filter((c) => c.status === 'ALERTA').length,
    };

    return { resumo, manutencoes, cascoPintura };
  }

  async getEventos(): Promise<NotificationEvent[]> {
    const { manutencoes, cascoPintura } = await this.getAlertas();

    const eventosManutencao: NotificationEvent[] = manutencoes.map((m) => ({
      id: `MANUTENCAO:${m.manutencaoId}`,
      type: 'MANUTENCAO',
      important: m.status === 'VENCIDO',
      title: `${m.tipoServico} — ${m.embarcacaoNome}`,
      description:
        m.status === 'VENCIDO'
          ? `Motor ${POSICAO_LABEL[m.motorPosicao] ?? m.motorPosicao}: manutenção vencida há ${Math.abs(m.horasRestantes)} h.`
          : `Motor ${POSICAO_LABEL[m.motorPosicao] ?? m.motorPosicao}: faltam ${m.horasRestantes} h.`,
      link: { label: 'Ver embarcação', href: `/embarcacoes/${m.embarcacaoId}` },
    }));

    const eventosCascoPintura: NotificationEvent[] = cascoPintura.map((c) => ({
      id: `CASCO_PINTURA:${c.cascoPinturaId}`,
      type: 'CASCO_PINTURA',
      important: c.status === 'VENCIDO',
      title: `${c.tipoIntervencao === 'CASCO' ? 'Casco' : 'Pintura'} — ${c.embarcacaoNome}`,
      description:
        c.status === 'VENCIDO'
          ? `Vencido há ${Math.abs(c.diasRestantes ?? 0)} dias.`
          : `Restam ${c.diasRestantes} dias.`,
      link: { label: 'Ver embarcação', href: `/embarcacoes/${c.embarcacaoId}` },
    }));

    return [...eventosManutencao, ...eventosCascoPintura];
  }

  async listForUser(userId: number) {
    const [eventos, lidas] = await Promise.all([
      this.getEventos(),
      this.prisma.notificationRead.findMany({ where: { usuarioId: userId }, select: { notificationId: true } }),
    ]);
    const lidasSet = new Set(lidas.map((l) => l.notificationId));

    return eventos
      .map((evento) => ({ ...evento, lida: lidasSet.has(evento.id) }))
      .sort((a, b) => Number(a.lida) - Number(b.lida) || Number(b.important) - Number(a.important));
  }

  async getSummary(userId: number) {
    const eventos = await this.listForUser(userId);
    return {
      total: eventos.length,
      naoLidas: eventos.filter((e) => !e.lida).length,
      importantes: eventos.filter((e) => e.important && !e.lida).length,
    };
  }

  async marcarLida(userId: number, notificationId: string) {
    const eventos = await this.getEventos();
    if (!eventos.some((e) => e.id === notificationId)) {
      throw new BadRequestException('Notificação não encontrada');
    }
    await this.prisma.notificationRead.upsert({
      where: { usuarioId_notificationId: { usuarioId: userId, notificationId } },
      create: { usuarioId: userId, notificationId },
      update: {},
    });
  }

  async marcarTodasLidas(userId: number) {
    const eventos = await this.getEventos();
    if (!eventos.length) return;
    await this.prisma.notificationRead.createMany({
      data: eventos.map((e) => ({ usuarioId: userId, notificationId: e.id })),
      skipDuplicates: true,
    });
  }
}
