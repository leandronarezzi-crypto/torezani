'use client';

import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/StatusDot';
import { POSICAO_LABEL, TIPO_MANUTENCAO_LABEL, TIPO_MANUTENCAO_TONE, STATUS_ALERTA_LABEL, STATUS_ALERTA_TONE, type OrdemServico } from '@/lib/types';

export default function OrdensServicoPage() {
  const { data: ordens, loading, error } = useFetch<OrdemServico[]>('/ordens-servico');

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          Documentos emitidos para execução de manutenção. Gere uma nova a partir de um item vencido em{' '}
          <Link href="/manutencoes" className="text-accent hover:underline">
            Manutenção da Frota
          </Link>{' '}
          ou na ficha da embarcação.
        </p>
      </div>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Emitida em</th>
              <th className="px-4 py-3">Embarcação</th>
              <th className="px-4 py-3">Motor</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Serviço</th>
              <th className="px-4 py-3">Situação na emissão</th>
              <th className="px-4 py-3">Emitido por</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-foreground-soft">
                  Carregando…
                </td>
              </tr>
            ) : !ordens?.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-foreground-soft">
                  Nenhuma ordem de serviço emitida ainda.
                </td>
              </tr>
            ) : (
              ordens.map((os) => (
                <tr key={os.id} className="border-t border-line last:border-0 hover:bg-background">
                  <td className="px-4 py-3 font-semibold text-foreground">OS-{String(os.id).padStart(6, '0')}</td>
                  <td className="px-4 py-3 text-foreground-soft">{formatDate(os.criadoEm)}</td>
                  <td className="px-4 py-3 text-foreground-soft">{os.embarcacao?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground-soft">{os.motor ? POSICAO_LABEL[os.motor.posicao] : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={TIPO_MANUTENCAO_TONE[os.tipo]}>{TIPO_MANUTENCAO_LABEL[os.tipo]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground-soft">{os.tipoServico}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_ALERTA_TONE[os.status]}>{STATUS_ALERTA_LABEL[os.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground-soft">{os.emitidoPorNome ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/ordens-servico/${os.id}`} className="text-xs font-semibold text-accent hover:underline">
                      Ver / Imprimir
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
