'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import { STATUS_CONTRATO_LABEL, type Cliente, type Contrato, type StatusContrato } from '@/lib/types';

const STATUS_OPCOES: StatusContrato[] = ['ATIVO', 'SUSPENSO', 'ENCERRADO'];

export default function NovoContratoPage() {
  const router = useRouter();
  const { data: clientes } = useFetch<Cliente[]>('/clientes');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post<Contrato>('/contratos', {
        clienteId: Number(form.get('clienteId')),
        numero: form.get('numero') || undefined,
        descricao: form.get('descricao') || undefined,
        valor: form.get('valor') ? Number(form.get('valor')) : undefined,
        dataInicio: form.get('dataInicio') || undefined,
        dataFim: form.get('dataFim') || undefined,
        status: form.get('status') as StatusContrato,
        observacoes: form.get('observacoes') || undefined,
      });
      router.push('/financeiro/contratos');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o contrato.');
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-sm text-foreground-soft">
          <Link href="/financeiro/contratos" className="hover:underline">
            Contratos
          </Link>{' '}
          / Novo
        </p>
        <h1 className="text-2xl font-bold text-foreground">Novo Contrato</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-6">
        {erro ? <p className="text-sm text-danger">{erro}</p> : null}
        <div>
          <label className={LABEL_CLASSE}>Cliente</label>
          <select name="clienteId" required defaultValue="" className={CAMPO_CLASSE}>
            <option value="" disabled>
              Selecione…
            </option>
            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASSE}>Número / identificação</label>
          <input name="numero" className={CAMPO_CLASSE} />
        </div>
        <div>
          <label className={LABEL_CLASSE}>Descrição</label>
          <textarea name="descricao" rows={2} className={CAMPO_CLASSE} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASSE}>Valor</label>
            <input name="valor" type="number" step="0.01" min="0" className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Início</label>
            <input name="dataInicio" type="date" className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Fim</label>
            <input name="dataFim" type="date" className={CAMPO_CLASSE} />
          </div>
        </div>
        <div>
          <label className={LABEL_CLASSE}>Status</label>
          <select name="status" defaultValue="ATIVO" className={CAMPO_CLASSE}>
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONTRATO_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASSE}>Observações</label>
          <textarea name="observacoes" rows={3} className={CAMPO_CLASSE} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/financeiro/contratos" className="px-3 py-2 text-sm text-foreground-soft hover:text-foreground">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Criar contrato'}
          </button>
        </div>
      </form>
    </div>
  );
}
