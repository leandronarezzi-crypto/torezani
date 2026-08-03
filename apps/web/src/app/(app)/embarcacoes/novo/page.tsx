'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import type { Embarcacao, TipoConfiguracao } from '@/lib/types';

export default function NovaEmbarcacaoPage() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const form = new FormData(e.currentTarget);
    try {
      const criada = await api.post<Embarcacao>('/embarcacoes', {
        nome: form.get('nome'),
        tipoConfiguracao: form.get('tipoConfiguracao') as TipoConfiguracao,
      });
      router.push(`/embarcacoes/${criada.id}`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a embarcação.');
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
          / Nova
        </p>
        <h1 className="text-2xl font-bold text-foreground">Nova Embarcação</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-6">
        {erro ? <p className="text-sm text-danger">{erro}</p> : null}
        <div>
          <label className={LABEL_CLASSE}>Nome</label>
          <input name="nome" required className={CAMPO_CLASSE} />
        </div>
        <div>
          <label className={LABEL_CLASSE}>Configuração</label>
          <select name="tipoConfiguracao" required defaultValue="MONOMOTOR" className={CAMPO_CLASSE}>
            <option value="MONOMOTOR">Monomotor</option>
            <option value="BIMOTOR">Bimotor</option>
          </select>
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
            {salvando ? 'Salvando…' : 'Criar embarcação'}
          </button>
        </div>
      </form>
    </div>
  );
}
