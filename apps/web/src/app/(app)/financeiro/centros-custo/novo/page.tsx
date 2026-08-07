'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import type { CentroCusto } from '@/lib/types';

export default function NovoCentroCustoPage() {
  const router = useRouter();
  const { data: centros } = useFetch<CentroCusto[]>('/centros-custo');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post<CentroCusto>('/centros-custo', {
        nome: form.get('nome'),
        paiId: form.get('paiId') ? Number(form.get('paiId')) : undefined,
      });
      router.push('/financeiro/centros-custo');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o centro de custo.');
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-sm text-foreground-soft">
          <Link href="/financeiro/centros-custo" className="hover:underline">
            Centros de Custo
          </Link>{' '}
          / Novo
        </p>
        <h1 className="text-2xl font-bold text-foreground">Novo Centro de Custo</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-6">
        {erro ? <p className="text-sm text-danger">{erro}</p> : null}
        <div>
          <label className={LABEL_CLASSE}>Nome</label>
          <input name="nome" required className={CAMPO_CLASSE} />
        </div>
        <div>
          <label className={LABEL_CLASSE}>Centro pai (opcional)</label>
          <select name="paiId" defaultValue="" className={CAMPO_CLASSE}>
            <option value="">Nenhum — é um centro de topo</option>
            {centros?.map((c) => (
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
            {salvando ? 'Salvando…' : 'Criar centro de custo'}
          </button>
        </div>
      </form>
    </div>
  );
}
