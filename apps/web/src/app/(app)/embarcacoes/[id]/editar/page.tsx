'use client';

import { use, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import { TIPO_CONFIGURACAO_LABEL, type Embarcacao } from '@/lib/types';

export default function EditarEmbarcacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: embarcacao, loading, error: erroCarregar } = useFetch<Embarcacao>(`/embarcacoes/${id}`);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.put(`/embarcacoes/${id}`, { nome: form.get('nome') });
      router.push('/embarcacoes');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a embarcação.');
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-sm text-foreground-soft">
          <Link href="/embarcacoes" className="hover:underline">
            Embarcações
          </Link>{' '}
          / Editar
        </p>
        <h1 className="text-2xl font-bold text-foreground">Editar Embarcação</h1>
      </div>

      {erroCarregar ? <p className="text-sm text-danger">{erroCarregar}</p> : null}
      {loading ? <p className="text-sm text-foreground-soft">Carregando…</p> : null}

      {embarcacao ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-6">
          {erro ? <p className="text-sm text-danger">{erro}</p> : null}
          <div>
            <label className={LABEL_CLASSE}>Nome</label>
            <input name="nome" required defaultValue={embarcacao.nome} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Configuração</label>
            <input value={TIPO_CONFIGURACAO_LABEL[embarcacao.tipoConfiguracao]} disabled className={`${CAMPO_CLASSE} bg-background text-foreground-soft`} />
            <p className="mt-1 text-xs text-foreground-soft">A configuração de motores não pode ser alterada após a criação.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/embarcacoes" className="px-3 py-2 text-sm text-foreground-soft hover:text-foreground">
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
