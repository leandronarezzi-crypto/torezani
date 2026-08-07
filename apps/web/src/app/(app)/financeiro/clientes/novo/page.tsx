'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import type { Cliente } from '@/lib/types';

export default function NovoClientePage() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post<Cliente>('/clientes', {
        nome: form.get('nome'),
        documento: form.get('documento') || undefined,
        contatoNome: form.get('contatoNome') || undefined,
        contatoEmail: form.get('contatoEmail') || undefined,
        contatoTelefone: form.get('contatoTelefone') || undefined,
        observacoes: form.get('observacoes') || undefined,
      });
      router.push('/financeiro/clientes');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o cliente.');
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-sm text-foreground-soft">
          <Link href="/financeiro/clientes" className="hover:underline">
            Clientes
          </Link>{' '}
          / Novo
        </p>
        <h1 className="text-2xl font-bold text-foreground">Novo Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-6">
        {erro ? <p className="text-sm text-danger">{erro}</p> : null}
        <div>
          <label className={LABEL_CLASSE}>Nome</label>
          <input name="nome" required className={CAMPO_CLASSE} />
        </div>
        <div>
          <label className={LABEL_CLASSE}>Documento (CNPJ/CPF)</label>
          <input name="documento" className={CAMPO_CLASSE} />
        </div>
        <div>
          <label className={LABEL_CLASSE}>Contato — nome</label>
          <input name="contatoNome" className={CAMPO_CLASSE} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASSE}>Contato — e-mail</label>
            <input name="contatoEmail" type="email" className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Contato — telefone</label>
            <input name="contatoTelefone" className={CAMPO_CLASSE} />
          </div>
        </div>
        <div>
          <label className={LABEL_CLASSE}>Observações</label>
          <textarea name="observacoes" rows={3} className={CAMPO_CLASSE} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/financeiro/clientes" className="px-3 py-2 text-sm text-foreground-soft hover:text-foreground">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Criar cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
