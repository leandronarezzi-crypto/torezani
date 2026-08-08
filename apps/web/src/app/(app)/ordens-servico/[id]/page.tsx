'use client';

import { use } from 'react';
import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { formatDate, formatNumber } from '@/lib/format';
import { POSICAO_LABEL, TIPO_MANUTENCAO_LABEL, type OrdemServico } from '@/lib/types';

const EMPRESA = {
  nome: 'Torezani Apoio Marítimo',
  endereco: 'Rua Artina Ribeiro Barbosa, 107, Centro, Macaé-RJ — CEP 27910-010',
  contato: 'Tel.: (22) 2762-7885 · Cel.: (22) 99815-7085 · disneytorezani@yahoo.com.br',
};

function numeroOs(id: number): string {
  return `OS-${String(id).padStart(6, '0')}`;
}

function statusTexto(os: OrdemServico): string {
  if (os.status === 'VENCIDO') return `Vencido há ${formatNumber(Math.abs(os.horasRestantes ?? 0))} h`;
  if (os.status === 'ALERTA') return `Faltam ${formatNumber(os.horasRestantes ?? 0)} h`;
  if (os.status === 'OK') return `Em dia (faltam ${formatNumber(os.horasRestantes ?? 0)} h)`;
  return 'Não se aplica (evento pontual)';
}

function Campo({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{valor ?? '—'}</dd>
    </div>
  );
}

function CampoEmBranco({ label, largura = 'w-full' }: { label: string; largura?: string }) {
  return (
    <div className={largura}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-4 border-b border-gray-400" />
    </div>
  );
}

export default function OrdemServicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: os, loading, error } = useFetch<OrdemServico>(`/ordens-servico/${id}`);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/ordens-servico" className="text-sm text-foreground-soft hover:text-foreground">
          ← Voltar para Ordens de Serviço
        </Link>
        {os ? (
          <button onClick={() => window.print()} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
            Imprimir Ordem de Serviço
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-danger print:hidden">{error}</p> : null}
      {loading ? <p className="text-sm text-foreground-soft print:hidden">Carregando…</p> : null}

      {os ? (
        <div className="relative overflow-hidden rounded-xl border border-line bg-white p-10 text-black shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          {/* Marca d'água: repete em cada página impressa via position: fixed. */}
          <div className="pointer-events-none fixed inset-0 z-0 hidden items-center justify-center opacity-[0.07] print:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-mark.png" alt="" className="w-[70vw] max-w-[500px] -rotate-[25deg]" />
          </div>
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.05] print:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-mark.png" alt="" className="w-[70%] max-w-[500px] -rotate-[25deg]" />
          </div>

          <div className="relative z-10">
            <header className="mb-6 flex items-start justify-between border-b border-gray-300 pb-4">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/logo-full.jpg" alt={EMPRESA.nome} className="mb-2 h-16 object-contain" />
                <p className="text-xs text-gray-500">{EMPRESA.endereco}</p>
                <p className="text-xs text-gray-500">{EMPRESA.contato}</p>
              </div>
              <div className="text-right">
                <h1 className="text-lg font-bold text-gray-900">Ordem de Serviço</h1>
                <p className="text-sm text-gray-600">{numeroOs(os.id)}</p>
                <p className="mt-1 text-xs text-gray-500">Emitida em {new Date(os.criadoEm).toLocaleString('pt-BR')}</p>
              </div>
            </header>

            <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Campo label="Embarcação" valor={os.embarcacao?.nome} />
              <Campo label="Motor" valor={os.motor ? POSICAO_LABEL[os.motor.posicao] : '—'} />
              <Campo label="Tipo de manutenção" valor={TIPO_MANUTENCAO_LABEL[os.tipo]} />
              <Campo label="Serviço" valor={os.tipoServico} />
              <Campo label="Horímetro na emissão" valor={os.horimetroAtual != null ? `${formatNumber(os.horimetroAtual)} h` : '—'} />
              <Campo label="Situação na emissão" valor={statusTexto(os)} />
              <Campo label="Emitido por" valor={os.emitidoPorNome} />
            </section>

            {os.observacoes ? (
              <section className="mb-6">
                <p className="text-xs uppercase tracking-wide text-gray-500">Observações</p>
                <p className="mt-1 text-sm text-gray-800">{os.observacoes}</p>
              </section>
            ) : null}

            <section className="mb-6 border-t border-gray-300 pt-5">
              <p className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">Preenchimento após execução</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <CampoEmBranco label="Data de execução" />
                <CampoEmBranco label="Horímetro na execução" />
                <CampoEmBranco label="Responsável técnico / oficina" largura="col-span-2" />
                <CampoEmBranco label="Serviço realizado / peças utilizadas" largura="col-span-2" />
                <CampoEmBranco label="Observações" largura="col-span-2" />
                <CampoEmBranco label="Assinatura" />
                <CampoEmBranco label="Data" />
              </div>
            </section>

            <footer className="mt-8 border-t border-gray-300 pt-4 text-xs text-gray-500">
              <p>
                Documento gerado automaticamente pelo sistema de gerenciamento de embarcações — {EMPRESA.nome}. Os dados de horímetro e
                situação refletem o momento da emissão desta OS.
              </p>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
