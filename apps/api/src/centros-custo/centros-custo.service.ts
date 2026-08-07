import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCentroCustoDto } from './dto/upsert-centro-custo.dto';

@Injectable()
export class CentrosCustoService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.centroCusto.findMany({ orderBy: { nome: 'asc' } });
  }

  async get(id: number) {
    const centro = await this.prisma.centroCusto.findUnique({ where: { id } });
    if (!centro) throw new NotFoundException('Centro de custo não encontrado');
    return centro;
  }

  private async validarPai(paiId: number, idAtual?: number) {
    if (paiId === idAtual) throw new ConflictException('Um centro de custo não pode ser pai de si mesmo');
    const pai = await this.prisma.centroCusto.findUnique({ where: { id: paiId } });
    if (!pai) throw new NotFoundException('Centro de custo pai não encontrado');
  }

  async create(dto: UpsertCentroCustoDto) {
    if (dto.paiId) await this.validarPai(dto.paiId);
    return this.prisma.centroCusto.create({ data: { nome: dto.nome.trim(), paiId: dto.paiId ?? null } });
  }

  async update(id: number, dto: UpsertCentroCustoDto) {
    await this.get(id);
    if (dto.paiId) await this.validarPai(dto.paiId, id);
    return this.prisma.centroCusto.update({ where: { id }, data: { nome: dto.nome.trim(), paiId: dto.paiId ?? null } });
  }

  /** So remove se nao houver despesas nem centros de custo filhos apontando para ele. */
  async remove(id: number) {
    await this.get(id);
    const [despesas, filhos] = await Promise.all([
      this.prisma.despesa.count({ where: { centroCustoId: id } }),
      this.prisma.centroCusto.count({ where: { paiId: id } }),
    ]);
    if (despesas > 0 || filhos > 0) {
      throw new ConflictException('Este centro de custo está em uso e não pode ser removido');
    }
    await this.prisma.centroCusto.delete({ where: { id } });
  }
}
