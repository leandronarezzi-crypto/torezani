'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import { CATEGORIA_DESPESA_LABEL, type CategoriaDespesa, type CentroCusto, type Despesa, type Embarcacao } from '@/lib/types';

const FORMAS_PAGAMENTO = ['Dinheiro', 'Pix', 'Boleto', 'Transferência', 'Cartão'];

export default function NovaDespesaPage() {
  const router = useRouter();
  const { data: embarcacoes } = useFetch<Embarcacao[]>('/embarcacoes');
  const { data: centrosCusto } = useFetch<CentroCusto[]>('/centros-custo');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post<Despesa>('/despesas', {
        categoria: form.get('categoria') as CategoriaDespesa,
        subcategoria: form.get('subcategoria') || undefined,
        embarcacaoId: form.get('embarcacaoId') ? Number(form.get('embarcacaoId')) : undefined,
        centroCustoId: form.get('centroCustoId') ? Number(form.get('centroCustoId')) : undefined,
        fornecedor: form.get('fornecedor') || undefined,
        numeroNotaFiscal: form.get('numeroNotaFiscal') || undefined,
        valor: Number(form.get('valor')),
        data: form.get('data'),
        formaPagamento: form.get('formaPagamento') || undefined,
        observacoes: form.get('observacoes') || undefined,
      });
      router.push('/financeiro/despesas');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a despesa.');
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-sm text-foreground-soft">
          <Link href="/financeiro/despesas" className="hover:underline">
            Despesas
          </Link>{' '}
          / Nova
        </p>
        <h1 className="text-2xl font-bold text-foreground">Nova Despesa</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-6">
        {erro ? <p className="text-sm text-danger">{erro}</p> : null}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASSE}>Categoria</label>
            <select name="categoria" required defaultValue="" className={CAMPO_CLASSE}>
              <option value="" disabled>
                Selecione…
              </option>
              {Object.entries(CATEGORIA_DESPESA_LABEL).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASSE}>Subcategoria</label>
            <input name="subcategoria" className={CAMPO_CLASSE} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASSE}>Embarcação</label>
            <select name="embarcacaoId" defaultValue="" className={CAMPO_CLASSE}>
              <option value="">Nenhuma</option>
              {embarcacoes?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASSE}>Centro de custo</label>
            <select name="centroCustoId" defaultValue="" className={CAMPO_CLASSE}>
              <option value="">Nenhum</option>
              {centrosCusto?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASSE}>Fornecedor</label>
            <input name="fornecedor" className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Nº Nota Fiscal</label>
            <input name="numeroNotaFiscal" className={CAMPO_CLASSE} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASSE}>Valor</label>
            <input name="valor" type="number" step="0.01" min="0.01" required className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Data</label>
            <input name="data" type="date" required className={CAMPO_CLASSE} />
          </div>
        </div>
        <div>
          <label className={LABEL_CLASSE}>Forma de pagamento</label>
          <input name="formaPagamento" list="formas-pagamento" className={CAMPO_CLASSE} />
          <datalist id="formas-pagamento">
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={LABEL_CLASSE}>Observações</label>
          <textarea name="observacoes" rows={3} className={CAMPO_CLASSE} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/financeiro/despesas" className="px-3 py-2 text-sm text-foreground-soft hover:text-foreground">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Criar despesa'}
          </button>
        </div>
      </form>
    </div>
  );
}
