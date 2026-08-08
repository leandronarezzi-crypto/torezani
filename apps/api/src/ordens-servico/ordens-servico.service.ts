import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { toNumber } from '../common/decimal';
import { computeManutencaoStatus } from '../common/alert-calculators';
import type { AuthUser } from '../common/types/auth-user';

function serialize(os: { horimetroAtual: unknown; [key: string]: unknown }) {
  return { ...os, horimetroAtual: toNumber(os.horimetroAtual as any) };
}

const INCLUDE = { embarcacao: true, motor: true, manutencao: true } as const;

@Injectable()
export class OrdensServicoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera uma Ordem de Servico a partir do estado ATUAL da manutencao (nunca do
   * que o cliente mandar): horimetro, status (vencido/alerta/ok) e horas
   * restantes sao capturados no momento da emissao e ficam congelados no
   * registro — e um comprovante permanente, nunca editado.
   */
  async gerar(dto: CreateOrdemServicoDto, usuario?: AuthUser) {
    const manutencao = await this.prisma.manutencaoPreventiva.findUnique({
      where: { id: dto.manutencaoId },
      include: { motor: { include: { embarcacao: true } } },
    });
    if (!manutencao) throw new NotFoundException('Manutenção não encontrada');

    const horimetroAtual = toNumber(manutencao.motor.horimetroAtual) ?? 0;
    const statusInfo =
      manutencao.tipo !== 'CORRETIVA' && manutencao.intervaloHoras != null
        ? computeManutencaoStatus(horimetroAtual, Number(manutencao.horimetroUltimaTroca), manutencao.intervaloHoras, manutencao.alertaLimiteHoras)
        : { horasRestantes: null as number | null, status: 'N/A' as const };

    const os = await this.prisma.ordemServico.create({
      data: {
        manutencaoId: manutencao.id,
        embarcacaoId: manutencao.motor.embarcacaoId,
        motorId: manutencao.motorId,
        tipo: manutencao.tipo,
        tipoServico: manutencao.tipoServico,
        horimetroAtual,
        horasRestantes: statusInfo.horasRestantes != null ? Math.round(statusInfo.horasRestantes) : null,
        status: statusInfo.status,
        observacoes: dto.observacoes?.trim() || null,
        emitidoPorId: usuario?.id ?? null,
        emitidoPorNome: usuario?.nome ?? null,
      },
      include: INCLUDE,
    });
    return serialize(os);
  }

  async list(embarcacaoId?: number) {
    const ordens = await this.prisma.ordemServico.findMany({
      where: embarcacaoId ? { embarcacaoId } : undefined,
      include: INCLUDE,
      orderBy: { criadoEm: 'desc' },
    });
    return ordens.map(serialize);
  }

  async get(id: number) {
    const os = await this.prisma.ordemServico.findUnique({ where: { id }, include: INCLUDE });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada');
    return serialize(os);
  }
}
