import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto';
import { CHECKLIST_TEMPLATE } from './checklist-template';
import { toNumber } from '../common/decimal';

function serialize(auditoria: { horimetro: unknown; [key: string]: unknown }) {
  return { ...auditoria, horimetro: toNumber(auditoria.horimetro as any) };
}

@Injectable()
export class AuditoriasService {
  constructor(private readonly prisma: PrismaService) {}

  getTemplate() {
    return CHECKLIST_TEMPLATE;
  }

  async listByEmbarcacaoId(embarcacaoId: number) {
    const auditorias = await this.prisma.auditoria.findMany({
      where: { embarcacaoId },
      orderBy: { dataRealizacao: 'desc' },
      include: { _count: { select: { itens: true } } },
    });
    return auditorias.map((a) => ({
      id: a.id,
      responsavel: a.responsavel,
      dataRealizacao: a.dataRealizacao,
      criadoEm: a.criadoEm,
      totalItens: a._count.itens,
    }));
  }

  async create(embarcacaoId: number, dto: CreateAuditoriaDto, criadoPorId: number) {
    const embarcacao = await this.prisma.embarcacao.findUnique({ where: { id: embarcacaoId } });
    if (!embarcacao) throw new NotFoundException('Embarcação não encontrada');

    const auditoria = await this.prisma.auditoria.create({
      data: {
        embarcacaoId,
        responsavel: dto.responsavel.trim(),
        dataRealizacao: new Date(dto.dataRealizacao),
        horimetro: dto.horimetro ?? null,
        observacoesGerais: dto.observacoesGerais || null,
        criadoPorId,
        itens: {
          create: dto.itens.map((item) => ({
            categoria: item.categoria,
            descricao: item.descricao,
            concluido: item.concluido,
            observacao: item.observacao || null,
            ordem: item.ordem,
          })),
        },
      },
      include: { itens: { orderBy: { ordem: 'asc' } }, embarcacao: true },
    });
    return serialize(auditoria);
  }

  async getById(id: number) {
    const auditoria = await this.prisma.auditoria.findUnique({
      where: { id },
      include: { itens: { orderBy: { ordem: 'asc' } }, embarcacao: true, criadoPor: { select: { nome: true } } },
    });
    if (!auditoria) throw new NotFoundException('Auditoria não encontrada');
    return serialize(auditoria);
  }
}
