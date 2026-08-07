'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import { STATUS_CONTRATO_LABEL, STATUS_CONTRATO_TONE, type Contrato } from '@/lib/types';
import { Badge } from '@/components/StatusDot';

export default function ContratosPage() {
  const { data: contratos, loading, error, refetch } = useFetch<Contrato[]>('/contratos');
  const [busca, setBusca] = useState('');
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    if (!contratos) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return contratos;
    return contratos.filter(
      (c) => (c.numero ?? '').toLowerCase().includes(termo) || (c.cliente?.nome ?? '').toLowerCase().includes(termo),
    );
  }, [contratos, busca]);

  async function excluir(c: Contrato) {
    if (!window.confirm(`Excluir o contrato "${c.numero || `#${c.id}`}"?\n\nReceitas vinculadas continuam guardadas e podem ser restauradas por um administrador.`)) return;
    setErroAcao(null);
    try {
      await api.delete(`/contratos/${c.id}`);
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível excluir o contrato.');
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="mt-1 text-sm text-foreground-soft">Contratos firmados com clientes.</p>
        </div>
        <Link href="/financeiro/contratos/novo" className="write-only rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Novo Contrato
        </Link>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por número ou cliente…"
        className="mb-4 w-full max-w-xs rounded-md border border-line bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
      />

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {erroAcao ? <p className="mb-4 text-sm text-danger">{erroAcao}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Vigência</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-foreground-soft">
                  Carregando…
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-foreground-soft">
                  Nenhum contrato encontrado.
                </td>
              </tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id} className="border-t border-line last:border-0 hover:bg-background">
                  <td className="px-4 py-3 font-semibold text-foreground">{c.numero || `#${c.id}`}</td>
                  <td className="px-4 py-3 text-foreground-soft">{c.cliente?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground-soft">{c.valor !== null ? `R$ ${formatNumber(c.valor)}` : '—'}</td>
                  <td className="px-4 py-3 text-foreground-soft">
                    {c.dataInicio ? formatDate(c.dataInicio) : '—'} {c.dataFim ? `– ${formatDate(c.dataFim)}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_CONTRATO_TONE[c.status]}>{STATUS_CONTRATO_LABEL[c.status]}</Badge>
                  </td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <Link href={`/financeiro/contratos/${c.id}/editar`} className="write-only text-foreground-soft hover:text-accent">
                      Editar
                    </Link>
                    <button onClick={() => excluir(c)} className="write-only text-danger hover:underline">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
