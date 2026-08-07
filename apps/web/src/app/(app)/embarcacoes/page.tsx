'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { TIPO_CONFIGURACAO_LABEL, type Embarcacao } from '@/lib/types';
import { Badge } from '@/components/StatusDot';

export default function EmbarcacoesPage() {
  const { data: embarcacoes, loading, error, refetch } = useFetch<Embarcacao[]>('/embarcacoes');
  const [busca, setBusca] = useState('');
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    if (!embarcacoes) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return embarcacoes;
    return embarcacoes.filter((v) => v.nome.toLowerCase().includes(termo));
  }, [embarcacoes, busca]);

  async function excluir(v: Embarcacao) {
    if (
      !window.confirm(
        `Excluir a embarcação "${v.nome}"?\n\nEla sai das listas e dos alertas, mas NADA é apagado: motores, manutenções e histórico continuam guardados e podem ser restaurados por um administrador.`,
      )
    )
      return;
    setErroAcao(null);
    try {
      await api.delete(`/embarcacoes/${v.id}`);
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível excluir a embarcação.');
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Embarcações</h1>
          <p className="mt-1 text-sm text-foreground-soft">Frota cadastrada e configuração de cada embarcação.</p>
        </div>
        <Link href="/embarcacoes/novo" className="write-only rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Nova Embarcação
        </Link>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome…"
        className="mb-4 w-full max-w-xs rounded-md border border-line bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
      />

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {erroAcao ? <p className="mb-4 text-sm text-danger">{erroAcao}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Configuração</th>
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
            ) : filtradas.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-foreground-soft">
                  Nenhuma embarcação encontrada.
                </td>
              </tr>
            ) : (
              filtradas.map((v) => (
                <tr key={v.id} className="border-t border-line last:border-0 hover:bg-background">
                  <td className="px-4 py-3">
                    <Link href={`/embarcacoes/${v.id}`} className="font-semibold text-accent hover:underline">
                      {v.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{TIPO_CONFIGURACAO_LABEL[v.tipoConfiguracao]}</Badge>
                  </td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <Link href={`/embarcacoes/${v.id}/relatorio`} className="text-foreground-soft hover:text-accent">
                      Relatório
                    </Link>
                    <Link href={`/embarcacoes/${v.id}/editar`} className="write-only text-foreground-soft hover:text-accent">
                      Editar
                    </Link>
                    <button onClick={() => excluir(v)} className="write-only text-danger hover:underline">
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
