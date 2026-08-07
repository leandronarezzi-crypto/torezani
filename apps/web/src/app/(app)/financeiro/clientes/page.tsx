'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import type { Cliente } from '@/lib/types';

export default function ClientesPage() {
  const { data: clientes, loading, error, refetch } = useFetch<Cliente[]>('/clientes');
  const [busca, setBusca] = useState('');
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    if (!clientes) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter((c) => c.nome.toLowerCase().includes(termo) || (c.documento ?? '').toLowerCase().includes(termo));
  }, [clientes, busca]);

  async function excluir(c: Cliente) {
    if (!window.confirm(`Excluir o cliente "${c.nome}"?\n\nContratos e receitas vinculados continuam guardados e podem ser restaurados por um administrador.`)) return;
    setErroAcao(null);
    try {
      await api.delete(`/clientes/${c.id}`);
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível excluir o cliente.');
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="mt-1 text-sm text-foreground-soft">Clientes cadastrados para contratos e receitas.</p>
        </div>
        <Link href="/financeiro/clientes/novo" className="write-only rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Novo Cliente
        </Link>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou documento…"
        className="mb-4 w-full max-w-xs rounded-md border border-line bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
      />

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {erroAcao ? <p className="mb-4 text-sm text-danger">{erroAcao}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-foreground-soft">
                  Carregando…
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-foreground-soft">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id} className="border-t border-line last:border-0 hover:bg-background">
                  <td className="px-4 py-3 font-semibold text-foreground">{c.nome}</td>
                  <td className="px-4 py-3 text-foreground-soft">{c.documento || '—'}</td>
                  <td className="px-4 py-3 text-foreground-soft">{c.contatoNome || c.contatoEmail || c.contatoTelefone || '—'}</td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <Link href={`/financeiro/clientes/${c.id}/editar`} className="write-only text-foreground-soft hover:text-accent">
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
