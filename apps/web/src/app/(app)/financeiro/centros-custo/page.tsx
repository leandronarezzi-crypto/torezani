'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import type { CentroCusto } from '@/lib/types';

export default function CentrosCustoPage() {
  const { data: centros, loading, error, refetch } = useFetch<CentroCusto[]>('/centros-custo');
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const porId = useMemo(() => new Map((centros ?? []).map((c) => [c.id, c])), [centros]);
  const ordenados = useMemo(() => {
    if (!centros) return [];
    return [...centros].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [centros]);

  async function excluir(c: CentroCusto) {
    if (!window.confirm(`Excluir o centro de custo "${c.nome}"?`)) return;
    setErroAcao(null);
    try {
      await api.delete(`/centros-custo/${c.id}`);
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível excluir o centro de custo.');
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Centros de Custo</h1>
          <p className="mt-1 text-sm text-foreground-soft">Taxonomia usada para classificar despesas (ex.: Operação → Navegação).</p>
        </div>
        <Link href="/financeiro/centros-custo/novo" className="write-only rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Novo Centro de Custo
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {erroAcao ? <p className="mb-4 text-sm text-danger">{erroAcao}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Centro pai</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-foreground-soft">
                  Carregando…
                </td>
              </tr>
            ) : ordenados.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-foreground-soft">
                  Nenhum centro de custo cadastrado.
                </td>
              </tr>
            ) : (
              ordenados.map((c) => (
                <tr key={c.id} className="border-t border-line last:border-0 hover:bg-background">
                  <td className="px-4 py-3 font-semibold text-foreground">{c.nome}</td>
                  <td className="px-4 py-3 text-foreground-soft">{c.paiId ? (porId.get(c.paiId)?.nome ?? '—') : '—'}</td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <Link href={`/financeiro/centros-custo/${c.id}/editar`} className="write-only text-foreground-soft hover:text-accent">
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
