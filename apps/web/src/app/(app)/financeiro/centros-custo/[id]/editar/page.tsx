'use client';

import { use, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import type { CentroCusto } from '@/lib/types';

export default function EditarCentroCustoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: centro, loading, error: erroCarregar } = useFetch<CentroCusto>(`/centros-custo/${id}`);
  const { data: centros } = useFetch<CentroCusto[]>('/centros-custo');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.put(`/centros-custo/${id}`, {
        nome: form.get('nome'),
        paiId: form.get('paiId') ? Number(form.get('paiId')) : undefined,
      });
      router.push('/financeiro/centros-custo');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar o centro de custo.');
      setSalvando(false);
    }
  }

  const opcoesPai = (centros ?? []).filter((c) => c.id !== Number(id));

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-sm text-foreground-soft">
          <Link href="/financeiro/centros-custo" className="hover:underline">
            Centros de Custo
          </Link>{' '}
          / Editar
        </p>
        <h1 className="text-2xl font-bold text-foreground">Editar Centro de Custo</h1>
      </div>

      {erroCarregar ? <p className="text-sm text-danger">{erroCarregar}</p> : null}
      {loading ? <p className="text-sm text-foreground-soft">Carregando…</p> : null}

      {centro ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-6">
          {erro ? <p className="text-sm text-danger">{erro}</p> : null}
          <div>
            <label className={LABEL_CLASSE}>Nome</label>
            <input name="nome" required defaultValue={centro.nome} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Centro pai (opcional)</label>
            <select name="paiId" defaultValue={centro.paiId ?? ''} className={CAMPO_CLASSE}>
              <option value="">Nenhum — é um centro de topo</option>
              {opcoesPai.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/financeiro/centros-custo" className="px-3 py-2 text-sm text-foreground-soft hover:text-foreground">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
