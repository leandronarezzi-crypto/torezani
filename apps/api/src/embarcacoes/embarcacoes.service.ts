import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MotoresService } from '../motores/motores.service';
import { CascoPinturaService } from '../casco-pintura/casco-pintura.service';
import { CreateEmbarcacaoDto } from './dto/create-embarcacao.dto';
import { UpdateEmbarcacaoDto } from './dto/update-embarcacao.dto';
import { UpdateLocalizacaoDto } from './dto/update-localizacao.dto';
import { toNumber } from '../common/decimal';

function serialize(embarcacao: { latitude: unknown; longitude: unknown; [key: string]: unknown }) {
  return { ...embarcacao, latitude: toNumber(embarcacao.latitude as any), longitude: toNumber(embarcacao.longitude as any) };
}

@Injectable()
export class EmbarcacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly motoresService: MotoresService,
    private readonly cascoPinturaService: CascoPinturaService,
  ) {}

  async list() {
    const embarcacoes = await this.prisma.embarcacao.findMany({ orderBy: { nome: 'asc' } });
    return embarcacoes.map(serialize);
  }

  async get(id: number) {
    const embarcacao = await this.prisma.embarcacao.findUnique({ where: { id } });
    if (!embarcacao) throw new NotFoundException('Embarcação não encontrada');
    return serialize(embarcacao);
  }

  async getDetail(id: number) {
    const embarcacao = await this.get(id);
    const [motores, cascoPintura] = await Promise.all([
      this.motoresService.getDetailedByEmbarcacaoId(id),
      this.cascoPinturaService.listByEmbarcacaoId(id),
    ]);
    return { ...embarcacao, motores, cascoPintura };
  }

  async create(dto: CreateEmbarcacaoDto) {
    return this.prisma.$transaction(async (tx) => {
      const embarcacao = await tx.embarcacao.create({
        data: { nome: dto.nome.trim(), tipoConfiguracao: dto.tipoConfiguracao },
      });
      const posicoes = dto.tipoConfiguracao === 'BIMOTOR' ? (['BORE_BABOR', 'ESTIBORDO'] as const) : (['MONO'] as const);
      for (const posicao of posicoes) {
        await tx.motor.create({ data: { embarcacaoId: embarcacao.id, posicao } });
      }
      return serialize(embarcacao);
    });
  }

  async update(id: number, dto: UpdateEmbarcacaoDto) {
    const exists = await this.prisma.embarcacao.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Embarcação não encontrada');
    const embarcacao = await this.prisma.embarcacao.update({ where: { id }, data: { nome: dto.nome.trim() } });
    return serialize(embarcacao);
  }

  async remove(id: number) {
    const exists = await this.prisma.embarcacao.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Embarcação não encontrada');
    await this.prisma.embarcacao.delete({ where: { id } });
  }

  async updateLocalizacao(id: number, dto: UpdateLocalizacaoDto) {
    const exists = await this.prisma.embarcacao.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Embarcação não encontrada');

    const embarcacao = await this.prisma.embarcacao.update({
      where: { id },
      data: { latitude: dto.latitude, longitude: dto.longitude, localizacaoAtualizadaEm: new Date() },
    });
    return serialize(embarcacao);
  }
}
