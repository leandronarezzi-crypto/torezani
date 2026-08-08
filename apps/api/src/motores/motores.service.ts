import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMotorDto } from './dto/update-motor.dto';
import { UpdateHorimetroDto } from './dto/update-horimetro.dto';
import { UpsertCaixaReversoraDto } from './dto/upsert-caixa-reversora.dto';
import { UpsertEixoHeliceDto } from './dto/upsert-eixo-helice.dto';
import { toNumber } from '../common/decimal';
import { computeManutencaoStatus } from '../common/alert-calculators';

const POSICAO_ORDEM: Record<string, number> = { MONO: 0, BORE_BABOR: 1, ESTIBORDO: 2 };

function serializeMotor(motor: { horimetroAtual: unknown; [key: string]: unknown }) {
  return { ...motor, horimetroAtual: toNumber(motor.horimetroAtual as any) };
}

function serializeManutencao(
  m: { tipo: string; horimetroUltimaTroca: unknown; intervaloHoras: number | null; alertaLimiteHoras: number; [key: string]: unknown },
  horimetroAtual: number,
) {
  const base = { ...m, horimetroUltimaTroca: toNumber(m.horimetroUltimaTroca as any) };

  // Corretiva e evento pontual: nao ha "proxima troca/inspecao" a calcular.
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
export class MotoresService {
  constructor(private readonly prisma: PrismaService) {}

  async getMotor(id: number) {
    const motor = await this.prisma.motor.findUnique({ where: { id } });
    if (!motor) throw new NotFoundException('Motor não encontrado');
    return serializeMotor(motor);
  }

  async listByEmbarcacaoId(embarcacaoId: number) {
    const motores = await this.prisma.motor.findMany({ where: { embarcacaoId } });
    return motores
      .sort((a, b) => (POSICAO_ORDEM[a.posicao] ?? 9) - (POSICAO_ORDEM[b.posicao] ?? 9))
      .map(serializeMotor);
  }

  async getDetailedByEmbarcacaoId(embarcacaoId: number) {
    const motores = await this.prisma.motor.findMany({
      where: { embarcacaoId },
      include: {
        caixaReversora: true,
        sistemaEixoHelice: true,
        correias: { orderBy: { id: 'asc' } },
        manutencoes: { orderBy: { id: 'asc' } },
      },
    });

    return motores
      .sort((a, b) => (POSICAO_ORDEM[a.posicao] ?? 9) - (POSICAO_ORDEM[b.posicao] ?? 9))
      .map((motor) => {
        const horimetroAtual = toNumber(motor.horimetroAtual) ?? 0;
        return {
          ...serializeMotor(motor),
          correias: motor.correias,
          manutencoes: motor.manutencoes.map((m) => serializeManutencao(m, horimetroAtual)),
        };
      });
  }

  async updateMotor(id: number, dto: UpdateMotorDto) {
    const exists = await this.prisma.motor.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Motor não encontrado');
    const motor = await this.prisma.motor.update({
      where: { id },
      data: {
        marca: dto.marca || null,
        modelo: dto.modelo || null,
        potenciaConfig: dto.potenciaConfig || null,
        numSerie: dto.numSerie || null,
      },
    });
    return serializeMotor(motor);
  }

  async updateHorimetro(id: number, dto: UpdateHorimetroDto) {
    const motor = await this.prisma.motor.findUnique({ where: { id } });
    if (!motor) throw new NotFoundException('Motor não encontrado');

    const atual = toNumber(motor.horimetroAtual) ?? 0;
    if (dto.horimetroAtual < atual) {
      throw new ConflictException(`O novo horímetro (${dto.horimetroAtual}) não pode ser menor que o valor atual (${atual})`);
    }

    const updated = await this.prisma.motor.update({
      where: { id },
      data: { horimetroAtual: dto.horimetroAtual },
    });
    return serializeMotor(updated);
  }

  async upsertCaixaReversora(motorId: number, dto: UpsertCaixaReversoraDto) {
    await this.assertMotorExists(motorId);
    return this.prisma.caixaReversora.upsert({
      where: { motorId },
      create: { motorId, marca: dto.marca || null, modelo: dto.modelo || null, ratio: dto.ratio || null },
      update: { marca: dto.marca || null, modelo: dto.modelo || null, ratio: dto.ratio || null },
    });
  }

  async upsertEixoHelice(motorId: number, dto: UpsertEixoHeliceDto) {
    await this.assertMotorExists(motorId);
    const data = {
      motorId,
      diametroHelice: dto.diametroHelice || null,
      passoHelice: dto.passoHelice || null,
      numPas: dto.numPas ?? null,
      diametroEixo: dto.diametroEixo || null,
      grauCone: dto.grauCone || null,
      comprimentoCone: dto.comprimentoCone || null,
    };
    return this.prisma.sistemaEixoHelice.upsert({
      where: { motorId },
      create: data,
      update: data,
    });
  }

  private async assertMotorExists(motorId: number) {
    const motor = await this.prisma.motor.findUnique({ where: { id: motorId } });
    if (!motor) throw new NotFoundException('Motor não encontrado');
  }
}
