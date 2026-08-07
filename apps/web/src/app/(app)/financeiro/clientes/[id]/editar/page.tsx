'use client';

import { use, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import type { Cliente } from '@/lib/types';

export default function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: cliente, loading, error: erroCarregar } = useFetch<Cliente>(`/clientes/${id}`);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.put(`/clientes/${id}`, {
        nome: form.get('nome'),
        documento: form.get('documento') || undefined,
        contatoNome: form.get('contatoNome') || undefined,
        contatoEmail: form.get('contatoEmail') || undefined,
        contatoTelefone: form.get('contatoTelefone') || undefined,
        observacoes: form.get('observacoes') || undefined,
      });
      router.push('/financeiro/clientes');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar o cliente.');
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
          / Editar
        </p>
        <h1 className="text-2xl font-bold text-foreground">Editar Cliente</h1>
      </div>

      {erroCarregar ? <p className="text-sm text-danger">{erroCarregar}</p> : null}
      {loading ? <p className="text-sm text-foreground-soft">Carregando…</p> : null}

      {cliente ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-6">
          {erro ? <p className="text-sm text-danger">{erro}</p> : null}
          <div>
            <label className={LABEL_CLASSE}>Nome</label>
            <input name="nome" required defaultValue={cliente.nome} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Documento (CNPJ/CPF)</label>
            <input name="documento" defaultValue={cliente.documento ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Contato — nome</label>
            <input name="contatoNome" defaultValue={cliente.contatoNome ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASSE}>Contato — e-mail</label>
              <input name="contatoEmail" type="email" defaultValue={cliente.contatoEmail ?? ''} className={CAMPO_CLASSE} />
            </div>
            <div>
              <label className={LABEL_CLASSE}>Contato — telefone</label>
              <input name="contatoTelefone" defaultValue={cliente.contatoTelefone ?? ''} className={CAMPO_CLASSE} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLASSE}>Observações</label>
            <textarea name="observacoes" rows={3} defaultValue={cliente.observacoes ?? ''} className={CAMPO_CLASSE} />
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
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
