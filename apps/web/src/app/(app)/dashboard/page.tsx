'use client';

import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { StatTile } from '@/components/StatTile';
import { StatusDot } from '@/components/StatusDot';
import { BoatIcon } from '@/components/BoatIcon';
import { POSICAO_LABEL, type DashboardAlertas, type Embarcacao } from '@/lib/types';

export default function DashboardPage() {
  const { data: alertas, loading: loadingAlertas, error: erroAlertas, refetch: refetchAlertas } = useFetch<DashboardAlertas>('/dashboard/alertas');
  const { data: embarcacoes, loading: loadingFrota, error: erroFrota, refetch: refetchFrota } = useFetch<Embarcacao[]>('/embarcacoes');

  function atualizar() {
    refetchAlertas();
    refetchFrota();
  }

  const resumo = alertas?.resumo;

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel de Alertas</h1>
          <p className="mt-1 text-sm text-foreground-soft">Manutenção preventiva e casco/pintura de toda a frota.</p>
        </div>
        <button onClick={atualizar} className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-background">
          Atualizar
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Manutenção Vencida" value={resumo?.manutencaoVencida ?? 0} loading={loadingAlertas} tone="bad" />
        <StatTile label="Manutenção em Alerta" value={resumo?.manutencaoAlerta ?? 0} loading={loadingAlertas} tone="warn" />
        <StatTile label="Casco/Pintura Vencido" value={resumo?.cascoPinturaVencido ?? 0} loading={loadingAlertas} tone="bad" />
        <StatTile label="Casco/Pintura em Alerta" value={resumo?.cascoPinturaAlerta ?? 0} loading={loadingAlertas} tone="warn" />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-soft">Sua Frota</h2>
        {erroFrota ? <p className="text-sm text-danger">{erroFrota}</p> : null}
        {!erroFrota && loadingFrota ? <p className="text-sm text-foreground-soft">Carregando…</p> : null}
        {!erroFrota && !loadingFrota && embarcacoes && embarcacoes.length === 0 ? (
          <p className="text-sm text-foreground-soft">Nenhuma embarcação cadastrada ainda.</p>
        ) : null}
        {embarcacoes && embarcacoes.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {embarcacoes.map((v) => (
              <Link
                key={v.id}
                href={`/embarcacoes/${v.id}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-line bg-card p-4 text-center transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
              >
                <BoatIcon />
                <span className="text-sm font-semibold leading-tight text-foreground">{v.nome}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mb-8">
        <div className="rounded-xl border border-line bg-card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Manutenção Preventiva</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
                <tr>
                  <th className="px-4 py-3">Embarcação</th>
                  <th className="px-4 py-3">Motor</th>
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3">Horas Restantes</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {erroAlertas ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-danger">
                      {erroAlertas}
                    </td>
                  </tr>
                ) : loadingAlertas ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-foreground-soft">
                      Carregando…
                    </td>
                  </tr>
                ) : !alertas?.manutencoes.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-foreground-soft">
                      Nenhum alerta de manutenção. Tudo em dia.
                    </td>
                  </tr>
                ) : (
                  alertas.manutencoes.map((item) => (
                    <tr key={item.manutencaoId} className="border-t border-line last:border-0 hover:bg-background">
                      <td className="px-4 py-3">
                        <Link href={`/embarcacoes/${item.embarcacaoId}`} className="font-semibold text-accent hover:underline">
                          {item.embarcacaoNome}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{POSICAO_LABEL[item.motorPosicao]}</td>
                      <td className="px-4 py-3">{item.tipoServico}</td>
                      <td className="px-4 py-3">{item.horasRestantes} h</td>
                      <td className="px-4 py-3">
                        <StatusDot status={item.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-xl border border-line bg-card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Casco / Pintura</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
                <tr>
                  <th className="px-4 py-3">Embarcação</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Dias Restantes</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {erroAlertas ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-danger">
                      {erroAlertas}
                    </td>
                  </tr>
                ) : loadingAlertas ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-foreground-soft">
                      Carregando…
                    </td>
                  </tr>
                ) : !alertas?.cascoPintura.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-foreground-soft">
                      Nenhum alerta de casco/pintura. Tudo em dia.
                    </td>
                  </tr>
                ) : (
                  alertas.cascoPintura.map((item) => (
                    <tr key={item.cascoPinturaId} className="border-t border-line last:border-0 hover:bg-background">
                      <td className="px-4 py-3">
                        <Link href={`/embarcacoes/${item.embarcacaoId}`} className="font-semibold text-accent hover:underline">
                          {item.embarcacaoNome}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{item.tipoIntervencao === 'CASCO' ? 'Casco' : 'Pintura'}</td>
                      <td className="px-4 py-3">{item.diasRestantes} dias</td>
                      <td className="px-4 py-3">
                        <StatusDot status={item.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
