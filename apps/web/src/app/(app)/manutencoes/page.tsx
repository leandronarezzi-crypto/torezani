'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import { StatusDot, Badge } from '@/components/StatusDot';
import {
  PERIODO_RELATORIO_LABEL,
  POSICAO_LABEL,
  TIPO_MANUTENCAO_LABEL,
  TIPO_MANUTENCAO_TONE,
  type ManutencoesDashboard,
  type OrdemServico,
  type PeriodoRelatorio,
  type TipoManutencao,
} from '@/lib/types';

const PERIODOS: PeriodoRelatorio[] = ['3m', '6m', '12m', '60m', 'tudo'];
const ABAS: Array<TipoManutencao | 'TODAS'> = ['TODAS', 'PREVENTIVA', 'PREDITIVA', 'CORRETIVA'];
const ABA_LABEL: Record<TipoManutencao | 'TODAS', string> = {
  TODAS: 'Todas',
  ...TIPO_MANUTENCAO_LABEL,
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid rounded-xl border border-line bg-card p-5">
      <h2 className="mb-4 text-lg font-bold text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

export default function ManutencoesDashboardPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>('12m');
  const [aba, setAba] = useState<TipoManutencao | 'TODAS'>('TODAS');
  const { data, loading, error, refetch } = useFetch<ManutencoesDashboard>(`/manutencoes/dashboard?periodo=${periodo}`);
  const [gerandoOsId, setGerandoOsId] = useState<number | null>(null);
  const [erroOs, setErroOs] = useState<string | null>(null);

  const vencidosFiltrados = useMemo(() => {
    if (!data) return [];
    if (aba === 'TODAS') return data.vencidos;
    return data.vencidos.filter((v) => v.tipo === aba);
  }, [data, aba]);

  const itensFiltrados = useMemo(() => {
    if (!data) return [];
    if (aba === 'TODAS') return data.itens;
    return data.itens.filter((i) => i.tipo === aba);
  }, [data, aba]);

  async function gerarOs(manutencaoId: number) {
    setErroOs(null);
    setGerandoOsId(manutencaoId);
    try {
      const os = await api.post<OrdemServico>('/ordens-servico', { manutencaoId });
      router.push(`/ordens-servico/${os.id}`);
    } catch (err) {
      setErroOs(err instanceof ApiError ? err.message : 'Não foi possível gerar a ordem de serviço.');
      setGerandoOsId(null);
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Barra de controles — não sai na impressão */}
      <div className="mb-6 print:hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manutenção da Frota</h1>
            <p className="mt-1 text-sm text-foreground-soft">Preventiva, Preditiva e Corretiva — o que foi feito e o que está vencido.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => refetch()} className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-background">
              Atualizar
            </button>
            <button
              onClick={() => window.print()}
              disabled={loading || !data}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              Baixar PDF
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                periodo === p
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-card text-foreground-soft hover:border-accent hover:text-accent'
              }`}
            >
              {PERIODO_RELATORIO_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {ABAS.map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                aba === t
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-line bg-card text-foreground-soft hover:border-foreground'
              }`}
            >
              {ABA_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-danger print:hidden">{error}</p> : null}
      {erroOs ? <p className="text-sm text-danger print:hidden">{erroOs}</p> : null}
      {loading ? <p className="text-sm text-foreground-soft print:hidden">Carregando…</p> : null}

      {data ? (
        <div>
          <header className="mb-6 rounded-xl border border-line bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold">Torezani Apoio Marítimo</p>
                <h2 className="mt-1 text-xl font-bold text-foreground">Relatório de Manutenção da Frota</h2>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-foreground">{data.periodo.label}</p>
                <p className="text-foreground-soft">
                  {data.periodo.inicio ? `${formatDate(data.periodo.inicio)} a ` : 'Até '}
                  {formatDate(data.periodo.fim)}
                </p>
                <p className="mt-1 text-xs text-foreground-soft">Emitido em {new Date(data.geradoEm).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-foreground-soft">Embarcações</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{data.resumo.totalEmbarcacoes}</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-foreground-soft">Vencidas</p>
              <p className={`mt-1 text-2xl font-bold ${data.resumo.manutencoesVencidas ? 'text-danger' : 'text-foreground'}`}>
                {data.resumo.manutencoesVencidas}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-foreground-soft">Em alerta</p>
              <p className={`mt-1 text-2xl font-bold ${data.resumo.manutencoesEmAlerta ? 'text-warn' : 'text-foreground'}`}>
                {data.resumo.manutencoesEmAlerta}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-foreground-soft">Custo no período</p>
              <p className="mt-1 text-2xl font-bold text-foreground">R$ {formatNumber(data.resumo.custoTotalPeriodo)}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(['PREVENTIVA', 'PREDITIVA', 'CORRETIVA'] as TipoManutencao[]).map((t) => (
              <div key={t} className="rounded-xl border border-line bg-card p-4">
                <Badge tone={TIPO_MANUTENCAO_TONE[t]}>{TIPO_MANUTENCAO_LABEL[t]}</Badge>
                <p className="mt-2 text-2xl font-bold text-foreground">{data.resumo.porTipo[t].servicos}</p>
                <p className="text-xs text-foreground-soft">
                  serviços no período{data.resumo.porTipo[t].custo ? ` · R$ ${formatNumber(data.resumo.porTipo[t].custo)}` : ''}
                </p>
              </div>
            ))}
          </div>

          <Secao titulo="Itens Vencidos">
            {vencidosFiltrados.length === 0 ? (
              <p className="text-sm text-foreground-soft">Nenhum item vencido{aba !== 'TODAS' ? ` em ${ABA_LABEL[aba]}` : ''}. Tudo em dia.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-foreground-soft">
                    <tr>
                      <th className="py-1 pr-3">Embarcação</th>
                      <th className="py-1 pr-3">Motor</th>
                      <th className="py-1 pr-3">Tipo</th>
                      <th className="py-1 pr-3">Serviço</th>
                      <th className="py-1 pr-3">Vencido há</th>
                      <th className="py-1 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {vencidosFiltrados.map((v) => (
                      <tr key={v.manutencaoId} className="border-t border-line">
                        <td className="py-2 pr-3">
                          <Link href={`/embarcacoes/${v.embarcacaoId}`} className="font-semibold text-accent hover:underline print:text-foreground print:no-underline">
                            {v.embarcacaoNome}
                          </Link>
                        </td>
                        <td className="py-2 pr-3">{POSICAO_LABEL[v.motorPosicao]}</td>
                        <td className="py-2 pr-3">
                          <Badge tone={TIPO_MANUTENCAO_TONE[v.tipo]}>{TIPO_MANUTENCAO_LABEL[v.tipo]}</Badge>
                        </td>
                        <td className="py-2 pr-3">{v.tipoServico}</td>
                        <td className="py-2 pr-3 text-danger">{formatNumber(Math.abs(v.horasRestantes ?? 0))} h</td>
                        <td className="py-2 text-right print:hidden">
                          <button
                            onClick={() => gerarOs(v.manutencaoId)}
                            disabled={gerandoOsId === v.manutencaoId}
                            className="write-only rounded px-2 py-1 text-xs font-semibold text-accent hover:bg-accent-soft disabled:opacity-50"
                          >
                            {gerandoOsId === v.manutencaoId ? 'Gerando…' : 'Gerar OS'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Secao>

          <Secao titulo="O que foi feito no período">
            {itensFiltrados.length === 0 ? (
              <p className="text-sm text-foreground-soft">Nenhum serviço executado no período{aba !== 'TODAS' ? ` em ${ABA_LABEL[aba]}` : ''}.</p>
            ) : (
              <div className="space-y-4">
                {itensFiltrados.map((item) => (
                  <div key={item.id} className="break-inside-avoid rounded-lg border border-line p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{item.tipoServico}</p>
                        <p className="mt-0.5 text-xs text-foreground-soft">
                          <Link href={`/embarcacoes/${item.embarcacaoId}`} className="text-accent hover:underline print:text-foreground print:no-underline">
                            {item.embarcacaoNome}
                          </Link>{' '}
                          · Motor {POSICAO_LABEL[item.motorPosicao]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={TIPO_MANUTENCAO_TONE[item.tipo]}>{TIPO_MANUTENCAO_LABEL[item.tipo]}</Badge>
                        <StatusDot status={item.status} />
                      </div>
                    </div>

                    <table className="mt-3 w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-foreground-soft">
                        <tr>
                          <th className="py-1 pr-3">Data</th>
                          <th className="py-1 pr-3">Horímetro</th>
                          <th className="py-1 pr-3">Custo</th>
                          <th className="py-1 pr-3">Fornecedor</th>
                          <th className="py-1 pr-3">Registrado por</th>
                          <th className="py-1">Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.execucoes.map((e) => (
                          <tr key={e.id} className="border-t border-line">
                            <td className="py-1.5 pr-3 whitespace-nowrap">{formatDate(e.dataExecucao)}</td>
                            <td className="py-1.5 pr-3 tabular-nums whitespace-nowrap">{formatNumber(e.horimetro)} h</td>
                            <td className="py-1.5 pr-3 whitespace-nowrap">{e.custo != null ? `R$ ${formatNumber(e.custo)}` : '—'}</td>
                            <td className="py-1.5 pr-3">{e.fornecedor ?? '—'}</td>
                            <td className="py-1.5 pr-3">{e.registradoPor ?? '—'}</td>
                            <td className="py-1.5 text-foreground-soft">{e.observacoes ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </Secao>

          <footer className="mt-8 border-t border-line pt-4 text-xs text-foreground-soft">
            <p>Documento gerado automaticamente pelo sistema de gerenciamento de embarcações — Torezani Apoio Marítimo.</p>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
