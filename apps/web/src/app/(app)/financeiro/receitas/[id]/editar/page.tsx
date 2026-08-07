'use client';

import { use, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import { STATUS_RECEITA_LABEL, type Cliente, type Contrato, type Embarcacao, type Receita, type StatusReceita } from '@/lib/types';

const STATUS_OPCOES: StatusReceita[] = ['PENDENTE', 'RECEBIDO', 'EM_ATRASO'];

export default function EditarReceitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: receita, loading, error: erroCarregar } = useFetch<Receita>(`/receitas/${id}`);
  const { data: clientes } = useFetch<Cliente[]>('/clientes');
  const { data: embarcacoes } = useFetch<Embarcacao[]>('/embarcacoes');
  const [clienteId, setClienteId] = useState('');
  const [contratoId, setContratoId] = useState('');
  const { data: contratos } = useFetch<Contrato[]>(clienteId ? `/contratos?clienteId=${clienteId}` : null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!receita) return;
    setClienteId(String(receita.clienteId));
    setContratoId(receita.contratoId ? String(receita.contratoId) : '');
  }, [receita]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.put(`/receitas/${id}`, {
        clienteId: Number(form.get('clienteId')),
        contratoId: form.get('contratoId') ? Number(form.get('contratoId')) : undefined,
        embarcacaoId: form.get('embarcacaoId') ? Number(form.get('embarcacaoId')) : undefined,
        tipoServico: form.get('tipoServico') || undefined,
        valorContratado: form.get('valorContratado') ? Number(form.get('valorContratado')) : undefined,
        valorFaturado: form.get('valorFaturado') ? Number(form.get('valorFaturado')) : undefined,
        valorRecebido: form.get('valorRecebido') ? Number(form.get('valorRecebido')) : undefined,
        data: form.get('data'),
        status: form.get('status') as StatusReceita,
        observacoes: form.get('observacoes') || undefined,
      });
      router.push('/financeiro/receitas');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a receita.');
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-sm text-foreground-soft">
          <Link href="/financeiro/receitas" className="hover:underline">
            Receitas
          </Link>{' '}
          / Editar
        </p>
        <h1 className="text-2xl font-bold text-foreground">Editar Receita</h1>
      </div>

      {erroCarregar ? <p className="text-sm text-danger">{erroCarregar}</p> : null}
      {loading ? <p className="text-sm text-foreground-soft">Carregando…</p> : null}

      {receita ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-6">
          {erro ? <p className="text-sm text-danger">{erro}</p> : null}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASSE}>Cliente</label>
              <select
                name="clienteId"
                required
                value={clienteId}
                onChange={(e) => {
                  setClienteId(e.target.value);
                  setContratoId('');
                }}
                className={CAMPO_CLASSE}
              >
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASSE}>Contrato</label>
              <select name="contratoId" value={contratoId} onChange={(e) => setContratoId(e.target.value)} disabled={!clienteId} className={CAMPO_CLASSE}>
                <option value="">Nenhum</option>
                {contratos?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero || `#${c.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASSE}>Embarcação</label>
              <select name="embarcacaoId" defaultValue={receita.embarcacaoId ?? ''} className={CAMPO_CLASSE}>
                <option value="">Nenhuma</option>
                {embarcacoes?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASSE}>Tipo de serviço</label>
              <input name="tipoServico" defaultValue={receita.tipoServico ?? ''} className={CAMPO_CLASSE} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLASSE}>Valor contratado</label>
              <input name="valorContratado" type="number" step="0.01" min="0" defaultValue={receita.valorContratado ?? ''} className={CAMPO_CLASSE} />
            </div>
            <div>
              <label className={LABEL_CLASSE}>Valor faturado</label>
              <input name="valorFaturado" type="number" step="0.01" min="0" defaultValue={receita.valorFaturado ?? ''} className={CAMPO_CLASSE} />
            </div>
            <div>
              <label className={LABEL_CLASSE}>Valor recebido</label>
              <input name="valorRecebido" type="number" step="0.01" min="0" defaultValue={receita.valorRecebido ?? ''} className={CAMPO_CLASSE} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASSE}>Data</label>
              <input name="data" type="date" required defaultValue={receita.data.slice(0, 10)} className={CAMPO_CLASSE} />
            </div>
            <div>
              <label className={LABEL_CLASSE}>Status</label>
              <select name="status" defaultValue={receita.status} className={CAMPO_CLASSE}>
                {STATUS_OPCOES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_RECEITA_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL_CLASSE}>Observações</label>
            <textarea name="observacoes" rows={3} defaultValue={receita.observacoes ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/financeiro/receitas" className="px-3 py-2 text-sm text-foreground-soft hover:text-foreground">
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
