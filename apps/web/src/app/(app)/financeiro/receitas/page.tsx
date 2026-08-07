'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import { STATUS_RECEITA_LABEL, STATUS_RECEITA_TONE, type Cliente, type Receita, type StatusReceita } from '@/lib/types';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import { Badge } from '@/components/StatusDot';

const STATUS_OPCOES: StatusReceita[] = ['PENDENTE', 'RECEBIDO', 'EM_ATRASO'];

export default function ReceitasPage() {
  const { data: clientes } = useFetch<Cliente[]>('/clientes');
  const [clienteId, setClienteId] = useState('');
  const [status, setStatus] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (clienteId) params.set('clienteId', clienteId);
    if (status) params.set('status', status);
    const qs = params.toString();
    return qs ? `/receitas?${qs}` : '/receitas';
  }, [clienteId, status]);

  const { data: receitas, loading, error, refetch } = useFetch<Receita[]>(query);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const totalRecebido = useMemo(() => (receitas ?? []).reduce((soma, r) => soma + (r.valorRecebido ?? 0), 0), [receitas]);

  async function excluir(r: Receita) {
    if (!window.confirm(`Excluir esta receita?`)) return;
    setErroAcao(null);
    try {
      await api.delete(`/receitas/${r.id}`);
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível excluir a receita.');
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Receitas</h1>
          <p className="mt-1 text-sm text-foreground-soft">Faturamento por cliente, contrato e embarcação.</p>
        </div>
        <Link href="/financeiro/receitas/novo" className="write-only rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Nova Receita
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-line bg-card p-4 sm:grid-cols-4">
        <div>
          <label className={LABEL_CLASSE}>Cliente</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={CAMPO_CLASSE}>
            <option value="">Todos</option>
            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASSE}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={CAMPO_CLASSE}>
            <option value="">Todos</option>
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>
                {STATUS_RECEITA_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {erroAcao ? <p className="mb-4 text-sm text-danger">{erroAcao}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contrato</th>
              <th className="px-4 py-3">Embarcação</th>
              <th className="px-4 py-3 text-right">Faturado</th>
              <th className="px-4 py-3 text-right">Recebido</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-foreground-soft">
                  Carregando…
                </td>
              </tr>
            ) : (receitas ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-foreground-soft">
                  Nenhuma receita encontrada.
                </td>
              </tr>
            ) : (
              receitas!.map((r) => (
                <tr key={r.id} className="border-t border-line last:border-0 hover:bg-background">
                  <td className="px-4 py-3 text-foreground-soft">{formatDate(r.data)}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{r.cliente?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground-soft">{r.contrato?.numero ?? (r.contrato ? `#${r.contrato.id}` : '—')}</td>
                  <td className="px-4 py-3 text-foreground-soft">{r.embarcacao?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-foreground-soft">{r.valorFaturado !== null ? `R$ ${formatNumber(r.valorFaturado)}` : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{r.valorRecebido !== null ? `R$ ${formatNumber(r.valorRecebido)}` : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_RECEITA_TONE[r.status]}>{STATUS_RECEITA_LABEL[r.status]}</Badge>
                  </td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <Link href={`/financeiro/receitas/${r.id}/editar`} className="write-only text-foreground-soft hover:text-accent">
                      Editar
                    </Link>
                    <button onClick={() => excluir(r)} className="write-only text-danger hover:underline">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {receitas && receitas.length > 0 ? (
            <tfoot>
              <tr className="border-t border-line bg-background font-semibold text-foreground">
                <td colSpan={5} className="px-4 py-3 text-right">
                  Total recebido
                </td>
                <td className="px-4 py-3 text-right">R$ {formatNumber(totalRecebido)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
