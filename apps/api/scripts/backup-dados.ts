/**
 * Backup completo dos dados do banco para arquivos locais.
 *
 * Uso (dentro de apps/api):
 *   npx ts-node scripts/backup-dados.ts
 *
 * Para fazer backup do banco de PRODUCAO a partir da sua maquina:
 *   Windows PowerShell:
 *     $env:DATABASE_URL="postgresql://...";  npx ts-node scripts/backup-dados.ts
 *
 * Gera a pasta backups/backup-AAAA-MM-DD-HHMM/ com:
 *   - um arquivo .json por tabela (formato exato, sem perda)
 *   - um arquivo .csv por tabela (para abrir no Excel)
 *   - resumo.txt com a contagem de registros
 *
 * O script SO LE o banco. Nao altera, nao apaga, nao cria nada.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const TABELAS: { nome: string; ler: () => Promise<unknown[]> }[] = [
  { nome: 'usuario', ler: () => prisma.usuario.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'embarcacao', ler: () => prisma.embarcacao.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'motor', ler: () => prisma.motor.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'caixa_reversora', ler: () => prisma.caixaReversora.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'sistema_eixo_helice', ler: () => prisma.sistemaEixoHelice.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'correia', ler: () => prisma.correia.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'manutencao_preventiva', ler: () => prisma.manutencaoPreventiva.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'manutencao_casco_pintura', ler: () => prisma.manutencaoCascoPintura.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'auditoria', ler: () => prisma.auditoria.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'auditoria_item', ler: () => prisma.auditoriaItem.findMany({ orderBy: { id: 'asc' } }) },
  { nome: 'notification_read', ler: () => prisma.notificationRead.findMany() },
];

function serializar(_chave: string, valor: unknown): unknown {
  if (valor === null || valor === undefined) return valor;
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === 'object' && typeof (valor as { toFixed?: unknown }).toFixed === 'function') {
    return String(valor); // Prisma.Decimal
  }
  if (typeof valor === 'bigint') return valor.toString();
  return valor;
}

function paraCsv(linhas: Record<string, unknown>[]): string {
  if (!linhas.length) return '';
  const colunas = Object.keys(linhas[0]);
  const escapar = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const texto = v instanceof Date ? v.toISOString() : String(v);
    return `"${texto.replace(/"/g, '""')}"`;
  };
  return [
    colunas.join(';'),
    ...linhas.map((linha) => colunas.map((c) => escapar(linha[c])).join(';')),
  ].join('\r\n');
}

function carimbo(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('\n  ERRO: DATABASE_URL nao definida.\n');
    process.exit(1);
  }

  const destino = path.resolve(process.cwd(), 'backups', `backup-${carimbo()}`);
  fs.mkdirSync(destino, { recursive: true });

  const resumo: string[] = [`Backup gerado em ${new Date().toISOString()}`, ''];
  const tudo: Record<string, unknown[]> = {};
  let total = 0;

  for (const tabela of TABELAS) {
    let registros: unknown[] = [];
    try {
      registros = await tabela.ler();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      resumo.push(`${tabela.nome.padEnd(30)} FALHOU: ${msg}`);
      console.error(`  ! ${tabela.nome}: ${msg}`);
      continue;
    }

    tudo[tabela.nome] = registros;
    total += registros.length;

    fs.writeFileSync(
      path.join(destino, `${tabela.nome}.json`),
      JSON.stringify(registros, serializar, 2),
      'utf8',
    );

    const csv = paraCsv(JSON.parse(JSON.stringify(registros, serializar)) as Record<string, unknown>[]);
    if (csv) fs.writeFileSync(path.join(destino, `${tabela.nome}.csv`), '﻿' + csv, 'utf8');

    resumo.push(`${tabela.nome.padEnd(30)} ${String(registros.length).padStart(6)} registros`);
    console.log(`  OK ${tabela.nome.padEnd(30)} ${registros.length}`);
  }

  fs.writeFileSync(
    path.join(destino, 'banco-completo.json'),
    JSON.stringify(tudo, serializar, 2),
    'utf8',
  );

  resumo.push('', `TOTAL: ${total} registros`);
  fs.writeFileSync(path.join(destino, 'resumo.txt'), resumo.join('\r\n'), 'utf8');

  console.log(`\n  Backup completo: ${total} registros`);
  console.log(`  Pasta: ${destino}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
