'use client';

import { use } from 'react';
import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { formatDate, formatNumber } from '@/lib/format';
import type { Auditoria } from '@/lib/types';

const EMPRESA = {
  nome: 'Torezani Apoio Marítimo',
  endereco: 'Rua Artina Ribeiro Barbosa, 107, Centro, Macaé-RJ — CEP 27910-010',
  contato: 'Tel.: (22) 2762-7885 · Cel.: (22) 99815-7085 · disneytorezani@yahoo.com.br',
  documento: 'PLA-SGI-002 — Plano de Manutenção e Controle',
};

export default function RelatorioAuditoriaPage({ params }: { params: Promise<{ id: string; auditoriaId: string }> }) {
  const { id, auditoriaId } = use(params);
  const { data: auditoria, loading, error } = useFetch<Auditoria>(`/auditorias/${auditoriaId}`);

  const grupos = auditoria
    ? Array.from(new Set(auditoria.itens.map((i) => i.categoria))).map((categoria) => ({
        categoria,
        itens: auditoria.itens.filter((i) => i.categoria === categoria),
      }))
    : [];

  const totalConcluidos = auditoria?.itens.filter((i) => i.concluido).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/embarcacoes/${id}`} className="text-sm text-foreground-soft hover:text-foreground">
          ← Voltar para a embarcação
        </Link>
        {auditoria ? (
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Imprimir relatório
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-danger print:hidden">{error}</p> : null}
      {loading ? <p className="text-sm text-foreground-soft print:hidden">Carregando…</p> : null}

      {auditoria ? (
        <div className="relative overflow-hidden rounded-xl border border-line bg-white p-10 text-black shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          {/* Marca d'água: repete em cada página impressa via position: fixed. */}
          <div className="pointer-events-none fixed inset-0 z-0 hidden items-center justify-center opacity-[0.07] print:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-mark.png" alt="" className="w-[70vw] max-w-[500px] -rotate-[25deg]" />
          </div>
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.05] print:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-mark.png" alt="" className="w-[70%] max-w-[500px] -rotate-[25deg]" />
          </div>

          <div className="relative z-10">
            <header className="mb-6 flex items-start justify-between border-b border-gray-300 pb-4">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/logo-full.jpg" alt="Torezani Apoio Marítimo" className="mb-2 h-16 object-contain" />
                <p className="text-xs text-gray-500">{EMPRESA.documento}</p>
              </div>
              <div className="text-right">
                <h1 className="text-lg font-bold text-gray-900">Relatório de Auditoria</h1>
                <p className="text-sm text-gray-600">Checklist de Manutenção Preventiva</p>
                <p className="mt-1 text-xs text-gray-500">Auditoria #{auditoria.id}</p>
              </div>
            </header>

            <section className="mb-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Field label="Embarcação" value={auditoria.embarcacao.nome} />
              <Field label="Responsável" value={auditoria.responsavel} />
              <Field label="Data" value={formatDate(auditoria.dataRealizacao)} />
              <Field label="Horímetro" value={auditoria.horimetro != null ? `${formatNumber(auditoria.horimetro)} h` : '—'} />
            </section>

            {grupos.map((grupo) => (
              <section key={grupo.categoria} className="mb-5 break-inside-avoid">
                <h2 className="mb-2 border-b border-gray-200 pb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                  {grupo.categoria}
                </h2>
                <div className="space-y-1.5">
                  {grupo.itens.map((item) => (
                    <div key={item.ordem} className="flex items-start gap-2 text-sm">
                      <span
                        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border text-[10px] font-bold ${
                          item.concluido ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-400 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="flex-1">
                        {item.descricao}
                        {item.observacao ? <span className="block text-xs text-gray-500">Obs.: {item.observacao}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {auditoria.observacoesGerais ? (
              <section className="mb-6 break-inside-avoid">
                <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">Observações Gerais</h2>
                <p className="whitespace-pre-wrap text-sm text-gray-800">{auditoria.observacoesGerais}</p>
              </section>
            ) : null}

            <section className="mb-8 break-inside-avoid rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 print:bg-transparent">
              <strong>{totalConcluidos}</strong> de <strong>{auditoria.itens.length}</strong> itens verificados nesta auditoria.
            </section>

            <section className="mb-10 grid grid-cols-2 gap-8 break-inside-avoid text-sm">
              <div>
                <div className="mb-1 h-10 border-b border-gray-400" />
                <p className="text-xs text-gray-500">Assinatura do responsável ({auditoria.responsavel})</p>
              </div>
              <div>
                <div className="mb-1 h-10 border-b border-gray-400" />
                <p className="text-xs text-gray-500">Visto — Torezani Apoio Marítimo</p>
              </div>
            </section>

            <footer className="border-t border-gray-300 pt-3 text-center text-[10px] text-gray-400">
              <p>{EMPRESA.nome} — {EMPRESA.endereco}</p>
              <p>{EMPRESA.contato}</p>
              <p className="mt-1">Relatório gerado em {formatDate(new Date().toISOString())} pelo sistema de gestão Torezani.</p>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
