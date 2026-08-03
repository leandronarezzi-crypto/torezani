import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertManutencaoDto } from './dto/upsert-manutencao.dto';
import { RegistrarServicoDto } from './dto/registrar-servico.dto';
import { toNumber } from '../common/decimal';
import { computeManutencaoStatus } from '../common/alert-calculators';

function annotate(m: { horimetroUltimaTroca: unknown; intervaloHoras: number; alertaLimiteHoras: number; [key: string]: unknown }, horimetroAtual: number) {
  const { proximaTroca, horasRestantes, status } = computeManutencaoStatus(
    horimetroAtual,
    Number(m.horimetroUltimaTroca),
    m.intervaloHoras,
    m.alertaLimiteHoras,
  );
  return { ...m, horimetroUltimaTroca: toNumber(m.horimetroUltimaTroca as any), proximaTroca, horasRestantes, status };
}

@Injectable()
export class ManutencoesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(motorId: number, dto: UpsertManutencaoDto) {
    const motor = await this.prisma.motor.findUnique({ where: { id: motorId } });
    if (!motor) throw new NotFoundException('Motor não encontrado');

    const manutencao = await this.prisma.manutencaoPreventiva.create({
      data: {
        motorId,
        tipoServico: dto.tipoServico.trim(),
        horimetroUltimaTroca: dto.horimetroUltimaTroca ?? 0,
        intervaloHoras: dto.intervaloHoras,
        alertaLimiteHoras: dto.alertaLimiteHoras ?? 0,
      },
    });
    return annotate(manutencao, toNumber(motor.horimetroAtual) ?? 0);
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

  async registrarServico(id: number, dto: RegistrarServicoDto) {
    const manutencao = await this.prisma.manutencaoPreventiva.findUnique({ where: { id }, include: { motor: true } });
    if (!manutencao) throw new NotFoundException('Manutenção não encontrada');

    const horimetroAtual = toNumber(manutencao.motor.horimetroAtual) ?? 0;
    const novoValor = dto.horimetro ?? horimetroAtual;

    const atualizada = await this.prisma.manutencaoPreventiva.update({
      where: { id },
      data: { horimetroUltimaTroca: novoValor },
    });
    return annotate(atualizada, horimetroAtual);
  }
}
