'use client';

import { use, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import type { Auditoria, ChecklistTemplateItem, Embarcacao, EmbarcacaoDetalhada } from '@/lib/types';

function hoje(): string {
  return new Date().toISOString().substring(0, 10);
}

export default function NovaAuditoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: embarcacao } = useFetch<Embarcacao>(`/embarcacoes/${id}`);
  const { data: detalhe } = useFetch<EmbarcacaoDetalhada>(`/embarcacoes/${id}/detail`);
  const { data: template, loading: loadingTemplate, error: erroTemplate } = useFetch<ChecklistTemplateItem[]>('/auditorias/template');

  const [responsavel, setResponsavel] = useState('');
  const [dataRealizacao, setDataRealizacao] = useState(hoje());
  const [horimetro, setHorimetro] = useState('');
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [itens, setItens] = useState<{ categoria: string; descricao: string; ordem: number; concluido: boolean; observacao: string }[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!template) return;
    setItens(template.map((t) => ({ ...t, concluido: false, observacao: '' })));
  }, [template]);

  useEffect(() => {
    if (!detalhe || horimetro !== '') return;
    const primeiro = detalhe.motores[0];
    if (primeiro) setHorimetro(String(primeiro.horimetroAtual));
  }, [detalhe, horimetro]);

  const grupos = useMemo(() => {
    const ordem: string[] = [];
    const porCategoria = new Map<string, typeof itens>();
    for (const item of itens) {
      if (!porCategoria.has(item.categoria)) {
        porCategoria.set(item.categoria, []);
        ordem.push(item.categoria);
      }
      porCategoria.get(item.categoria)!.push(item);
    }
    return ordem.map((categoria) => ({ categoria, itens: porCategoria.get(categoria)! }));
  }, [itens]);

  function toggleItem(ordemItem: number) {
    setItens((prev) => prev.map((it) => (it.ordem === ordemItem ? { ...it, concluido: !it.concluido } : it)));
  }

  function setObservacaoItem(ordemItem: number, valor: string) {
    setItens((prev) => prev.map((it) => (it.ordem === ordemItem ? { ...it, observacao: valor } : it)));
  }

  const totalConcluidos = itens.filter((i) => i.concluido).length;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    if (!responsavel.trim()) {
      setErro('Informe o responsável pela auditoria.');
      return;
    }
    setSalvando(true);
    try {
      const criada = await api.post<Auditoria>(`/embarcacoes/${id}/auditorias`, {
        responsavel,
        dataRealizacao,
        horimetro: horimetro !== '' ? Number(horimetro) : undefined,
        observacoesGerais: observacoesGerais || undefined,
        itens: itens.map(({ categoria, descricao, ordem, concluido, observacao }) => ({
          categoria,
          descricao,
          ordem,
          concluido,
          observacao: observacao || undefined,
        })),
      });
      router.push(`/embarcacoes/${id}/auditoria/${criada.id}`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a auditoria.');
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <p className="text-sm text-foreground-soft">
          <Link href={`/embarcacoes/${id}`} className="hover:underline">
            {embarcacao?.nome ?? 'Embarcação'}
          </Link>{' '}
          / Nova Auditoria
        </p>
        <h1 className="text-2xl font-bold text-foreground">Checklist de Auditoria de Manutenção</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          Baseado no plano de manutenção oficial (PLA-SGI-002). Marque cada item verificado e registre observações quando necessário.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {erro ? <p className="text-sm text-danger">{erro}</p> : null}

        <div className="grid gap-4 rounded-xl border border-line bg-card p-5 sm:grid-cols-3">
          <div>
            <label className={LABEL_CLASSE}>Responsável pela auditoria</label>
            <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} required className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Data</label>
            <input type="date" value={dataRealizacao} onChange={(e) => setDataRealizacao(e.target.value)} required className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Horímetro no momento</label>
            <input type="number" step="0.01" min={0} value={horimetro} onChange={(e) => setHorimetro(e.target.value)} className={CAMPO_CLASSE} />
          </div>
        </div>

        {erroTemplate ? <p className="text-sm text-danger">{erroTemplate}</p> : null}
        {loadingTemplate ? <p className="text-sm text-foreground-soft">Carregando checklist…</p> : null}

        {grupos.map((grupo) => (
          <div key={grupo.categoria} className="rounded-xl border border-line bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-soft">{grupo.categoria}</h2>
            <div className="space-y-3">
              {grupo.itens.map((item) => (
                <div key={item.ordem} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.concluido}
                      onChange={() => toggleItem(item.ordem)}
                      className="mt-1 h-4 w-4 flex-shrink-0 accent-accent"
                    />
                    <span className={`text-sm ${item.concluido ? 'text-foreground' : 'text-foreground'}`}>{item.descricao}</span>
                  </label>
                  <input
                    value={item.observacao}
                    onChange={(e) => setObservacaoItem(item.ordem, e.target.value)}
                    placeholder="Observação (opcional)"
                    className="mt-2 ml-7 w-[calc(100%-1.75rem)] rounded-md border border-line bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-line bg-card p-5">
          <label className={LABEL_CLASSE}>Observações gerais</label>
          <textarea
            value={observacoesGerais}
            onChange={(e) => setObservacoesGerais(e.target.value)}
            rows={3}
            className={CAMPO_CLASSE}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line bg-card p-5">
          <p className="text-sm text-foreground-soft">
            <span className="font-semibold text-foreground">{totalConcluidos}</span> de {itens.length} itens marcados como verificados.
          </p>
          <div className="flex gap-3">
            <Link href={`/embarcacoes/${id}`} className="px-3 py-2 text-sm text-foreground-soft hover:text-foreground">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={salvando || itens.length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : 'Salvar e Gerar Relatório'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
