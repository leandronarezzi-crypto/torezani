import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCorreiaDto } from './dto/create-correia.dto';
import { UpdateCorreiaDto } from './dto/update-correia.dto';

@Injectable()
export class CorreiasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(motorId: number, dto: CreateCorreiaDto) {
    const motor = await this.prisma.motor.findUnique({ where: { id: motorId } });
    if (!motor) throw new NotFoundException('Motor não encontrado');

    return this.prisma.correia.create({
      data: {
        motorId,
        funcaoAplicacao: dto.funcaoAplicacao || null,
        especificacaoTamanho: dto.especificacaoTamanho || null,
        quantidade: dto.quantidade || 1,
      },
    });
  }

  async update(id: number, dto: UpdateCorreiaDto) {
    const exists = await this.prisma.correia.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Correia não encontrada');

    return this.prisma.correia.update({
      where: { id },
      data: {
        funcaoAplicacao: dto.funcaoAplicacao || null,
        especificacaoTamanho: dto.especificacaoTamanho || null,
        quantidade: dto.quantidade || 1,
      },
    });
  }

  async remove(id: number) {
    const exists = await this.prisma.correia.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Correia não encontrada');
    await this.prisma.correia.delete({ where: { id } });
  }
}
