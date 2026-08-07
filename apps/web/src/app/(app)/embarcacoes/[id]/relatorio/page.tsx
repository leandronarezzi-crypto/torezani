'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { formatDate, formatNumber } from '@/lib/format';
import { StatusDot, Badge } from '@/components/StatusDot';
import {
  PERIODO_RELATORIO_LABEL,
  TIPO_CONFIGURACAO_LABEL,
  TIPO_INTERVENCAO_LABEL,
  type PeriodoRelatorio,
  type RelatorioEmbarcacao,
} from '@/lib/types';

const PERIODOS: PeriodoRelatorio[] = ['3m', '6m', '12m', '60m', 'tudo'];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid rounded-xl border border-line bg-card p-5">
      <h2 className="mb-4 text-lg font-bold text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-foreground-soft">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{valor ?? '—'}</dd>
    </div>
  );
}

export default function RelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>('12m');
  const { data, loading, error } = useFetch<RelatorioEmbarcacao>(`/embarcacoes/${id}/relatorio?periodo=${periodo}`);

  return (
    <div className="max-w-5xl">
      {/* Barra de controles — não sai na impressão */}
      <div className="mb-6 print:hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/embarcacoes/${id}`} className="text-sm text-foreground-soft hover:text-accent">
              ← Voltar para a embarcação
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Relatório de Auditoria</h1>
            <p className="mt-1 text-sm text-foreground-soft">
              Histórico completo da embarcação no período selecionado.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            disabled={loading || !data}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            Baixar PDF
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
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
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-sm text-foreground-soft">Carregando relatório…</p> : null}

      {data ? (
        <div>
          {/* Cabeçalho do documento */}
          <header className="mb-6 rounded-xl border border-line bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                  Torezani Apoio Marítimo
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">{data.embarcacao.nome}</h2>
                <p className="mt-1 text-sm text-foreground-soft">
                  {TIPO_CONFIGURACAO_LABEL[data.embarcacao.tipoConfiguracao]} · Relatório de auditoria
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-foreground">{data.periodo.label}</p>
                <p className="text-foreground-soft">
                  {data.periodo.inicio ? `${formatDate(data.periodo.inicio)} a ` : 'Até '}
                  {formatDate(data.periodo.fim)}
                </p>
                <p className="mt-1 text-xs text-foreground-soft">
                  Emitido em {new Date(data.geradoEm).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </header>

          {/* Resumo */}
          <Secao titulo="Resumo do período">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Campo label="Motores" valor={data.resumo.totalMotores} />
              <Campo label="Planos de manutenção" valor={data.resumo.totalPlanos} />
              <Campo
                label="Vencidas"
                valor={<span className={data.resumo.manutencoesVencidas ? 'text-danger' : ''}>{data.resumo.manutencoesVencidas}</span>}
              />
              <Campo
                label="Em alerta"
                valor={<span className={data.resumo.manutencoesEmAlerta ? 'text-warn' : ''}>{data.resumo.manutencoesEmAlerta}</span>}
              />
              <Campo label="Serviços executados" valor={data.resumo.servicosExecutadosNoPeriodo} />
              <Campo label="Casco / pintura" valor={data.resumo.intervencoesCascoPintura} />
              <Campo label="Auditorias" valor={data.resumo.auditoriasRealizadas} />
            </dl>
          </Secao>

          {/* Motores */}
          {data.motores.map((motor) => (
            <Secao key={motor.id} titulo={`Motor ${motor.posicaoLabel}`}>
              <dl className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Campo label="Fabricante" valor={motor.marca} />
                <Campo label="Modelo" valor={motor.modelo} />
                <Campo label="Potência" valor={motor.potenciaConfig} />
                <Campo label="Nº de série" valor={motor.numSerie} />
                <Campo label="Horímetro atual" valor={`${formatNumber(motor.horimetroAtual)} h`} />
                {motor.caixaReversora ? (
                  <Campo
                    label="Caixa reversora"
                    valor={[motor.caixaReversora.marca, motor.caixaReversora.modelo, motor.caixaReversora.ratio]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  />
                ) : null}
                {motor.sistemaEixoHelice ? (
                  <Campo
                    label="Hélice"
                    valor={[motor.sistemaEixoHelice.diametroHelice, motor.sistemaEixoHelice.passoHelice]
                      .filter(Boolean)
                      .join(' × ') || '—'}
                  />
                ) : null}
                {motor.correias.length ? <Campo label="Correias" valor={`${motor.correias.length} cadastrada(s)`} /> : null}
              </dl>

              {motor.manutencoes.length === 0 ? (
                <p className="text-sm text-foreground-soft">Nenhum plano de manutenção cadastrado.</p>
              ) : (
                <div className="space-y-4">
                  {motor.manutencoes.map((m) => (
                    <div key={m.id} className="break-inside-avoid rounded-lg border border-line p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{m.tipoServico}</p>
                          <p className="mt-0.5 text-xs text-foreground-soft">
                            Intervalo {m.intervaloHoras} h · Última troca {formatNumber(m.horimetroUltimaTroca)} h ·
                            Próxima {formatNumber(m.proximaTroca)} h
                          </p>
                        </div>
                        <StatusDot status={m.status} />
                      </div>

                      <div className="mt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-soft">
                          Histórico de execuções no período
                        </p>
                        {m.execucoes.length === 0 ? (
                          <p className="text-sm text-foreground-soft">Nenhum serviço registrado neste período.</p>
                        ) : (
                          <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wide text-foreground-soft">
                              <tr>
                                <th className="py-1 pr-3">Data</th>
                                <th className="py-1 pr-3">Horímetro</th>
                                <th className="py-1 pr-3">Registrado por</th>
                                <th className="py-1">Observações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {m.execucoes.map((e) => (
                                <tr key={e.id} className="border-t border-line">
                                  <td className="py-1.5 pr-3 whitespace-nowrap">{formatDate(e.dataExecucao)}</td>
                                  <td className="py-1.5 pr-3 tabular-nums whitespace-nowrap">{formatNumber(e.horimetro)} h</td>
                                  <td className="py-1.5 pr-3">{e.registradoPor ?? '—'}</td>
                                  <td className="py-1.5 text-foreground-soft">{e.observacoes ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Secao>
          ))}

          {/* Casco e pintura */}
          <Secao titulo="Casco e pintura">
            {data.cascoPintura.length === 0 ? (
              <p className="text-sm text-foreground-soft">Nenhuma intervenção registrada no período.</p>
            ) : (
              <div className="space-y-3">
                {data.cascoPintura.map((c) => (
                  <div key={c.id} className="break-inside-avoid rounded-lg border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge>{TIPO_INTERVENCAO_LABEL[c.tipoIntervencao]}</Badge>
                      <StatusDot status={c.status} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <Campo label="Execução" valor={formatDate(c.dataExecucao)} />
                      <Campo label="Horímetro" valor={c.horimetroEmbarcacao ? `${formatNumber(c.horimetroEmbarcacao)} h` : '—'} />
                      <Campo label="Vencimento" valor={formatDate(c.alertaVencimentoData)} />
                      <Campo label="Produtos" valor={c.esquemaProdutos} />
                    </dl>
                    {c.historicoObservacoes ? (
                      <p className="mt-3 text-sm text-foreground-soft">{c.historicoObservacoes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Secao>

          {/* Auditorias */}
          <Secao titulo="Auditorias realizadas">
            {data.auditorias.length === 0 ? (
              <p className="text-sm text-foreground-soft">Nenhuma auditoria realizada no período.</p>
            ) : (
              <div className="space-y-3">
                {data.auditorias.map((a) => (
                  <div key={a.id} className="break-inside-avoid rounded-lg border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{a.responsavel}</p>
                      <p className="text-sm text-foreground-soft">{formatDate(a.dataRealizacao)}</p>
                    </div>
                    <p className="mt-1 text-sm text-foreground-soft">
                      {a.itensConcluidos} de {a.totalItens} itens concluídos
                      {a.horimetro ? ` · ${formatNumber(a.horimetro)} h` : ''}
                    </p>
                    {a.observacoesGerais ? (
                      <p className="mt-2 text-sm text-foreground-soft">{a.observacoesGerais}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Secao>

          <footer className="mt-8 border-t border-line pt-4 text-xs text-foreground-soft">
            <p>
              Documento gerado automaticamente pelo sistema de gerenciamento de embarcações — Torezani Apoio Marítimo.
              Os registros de execução são permanentes e não podem ser alterados após o lançamento.
            </p>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
