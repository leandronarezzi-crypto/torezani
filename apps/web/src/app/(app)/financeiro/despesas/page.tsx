'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import { CATEGORIA_DESPESA_LABEL, type CategoriaDespesa, type Despesa, type Embarcacao } from '@/lib/types';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';

export default function DespesasPage() {
  const { data: embarcacoes } = useFetch<Embarcacao[]>('/embarcacoes');
  const [embarcacaoId, setEmbarcacaoId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (embarcacaoId) params.set('embarcacaoId', embarcacaoId);
    if (categoria) params.set('categoria', categoria);
    if (dataInicio) params.set('dataInicio', dataInicio);
    if (dataFim) params.set('dataFim', dataFim);
    const qs = params.toString();
    return qs ? `/despesas?${qs}` : '/despesas';
  }, [embarcacaoId, categoria, dataInicio, dataFim]);

  const { data: despesas, loading, error, refetch } = useFetch<Despesa[]>(query);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const total = useMemo(() => (despesas ?? []).reduce((soma, d) => soma + d.valor, 0), [despesas]);

  async function excluir(d: Despesa) {
    if (!window.confirm(`Excluir esta despesa de R$ ${formatNumber(d.valor)}?`)) return;
    setErroAcao(null);
    try {
      await api.delete(`/despesas/${d.id}`);
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível excluir a despesa.');
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Despesas</h1>
          <p className="mt-1 text-sm text-foreground-soft">Lançamentos de custos da frota e da operação.</p>
        </div>
        <Link href="/financeiro/despesas/novo" className="write-only rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Nova Despesa
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-line bg-card p-4 sm:grid-cols-4">
        <div>
          <label className={LABEL_CLASSE}>Embarcação</label>
          <select value={embarcacaoId} onChange={(e) => setEmbarcacaoId(e.target.value)} className={CAMPO_CLASSE}>
            <option value="">Todas</option>
            {embarcacoes?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASSE}>Categoria</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={CAMPO_CLASSE}>
            <option value="">Todas</option>
            {Object.entries(CATEGORIA_DESPESA_LABEL).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASSE}>De</label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={CAMPO_CLASSE} />
        </div>
        <div>
          <label className={LABEL_CLASSE}>Até</label>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={CAMPO_CLASSE} />
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {erroAcao ? <p className="mb-4 text-sm text-danger">{erroAcao}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Embarcação</th>
              <th className="px-4 py-3">Centro de custo</th>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-foreground-soft">
                  Carregando…
                </td>
              </tr>
            ) : (despesas ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-foreground-soft">
                  Nenhuma despesa encontrada.
                </td>
              </tr>
            ) : (
              despesas!.map((d) => (
                <tr key={d.id} className="border-t border-line last:border-0 hover:bg-background">
                  <td className="px-4 py-3 text-foreground-soft">{formatDate(d.data)}</td>
                  <td className="px-4 py-3 text-foreground">
                    {CATEGORIA_DESPESA_LABEL[d.categoria as CategoriaDespesa]}
                    {d.subcategoria ? <span className="text-foreground-soft"> · {d.subcategoria}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-foreground-soft">{d.embarcacao?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground-soft">{d.centroCusto?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground-soft">{d.fornecedor ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">R$ {formatNumber(d.valor)}</td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <Link href={`/financeiro/despesas/${d.id}/editar`} className="write-only text-foreground-soft hover:text-accent">
                      Editar
                    </Link>
                    <button onClick={() => excluir(d)} className="write-only text-danger hover:underline">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {despesas && despesas.length > 0 ? (
            <tfoot>
              <tr className="border-t border-line bg-background font-semibold text-foreground">
                <td colSpan={5} className="px-4 py-3 text-right">
                  Total
                </td>
                <td className="px-4 py-3 text-right">R$ {formatNumber(total)}</td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
