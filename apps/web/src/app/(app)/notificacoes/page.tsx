'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import type { NotificationEvent } from '@/lib/types';

export default function NotificacoesPage() {
  const { data: eventos, loading, error, refetch } = useFetch<NotificationEvent[]>('/notifications');
  const [aba, setAba] = useState<'todas' | 'nao-lidas'>('todas');
  const [processando, setProcessando] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const naoLidas = useMemo(() => (eventos ?? []).filter((e) => !e.lida).length, [eventos]);
  const visiveis = useMemo(() => {
    if (!eventos) return [];
    return aba === 'nao-lidas' ? eventos.filter((e) => !e.lida) : eventos;
  }, [eventos, aba]);

  async function marcarLida(id: string) {
    setErroAcao(null);
    setProcessando(id);
    try {
      await api.patch(`/notifications/${encodeURIComponent(id)}/read`);
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível marcar como lida.');
    } finally {
      setProcessando(null);
    }
  }

  async function marcarTodas() {
    setErroAcao(null);
    try {
      await api.post('/notifications/read-all');
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível marcar as notificações como lidas.');
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="mt-1 text-sm text-foreground-soft">Manutenções e casco/pintura vencendo ou próximos do limite.</p>
        </div>
        {naoLidas > 0 ? (
          <button onClick={marcarTodas} className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-background">
            Marcar todas como lidas
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex gap-1 rounded-lg border border-line p-0.5" style={{ width: 'fit-content' }}>
        <button
          onClick={() => setAba('todas')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${aba === 'todas' ? 'bg-accent text-white' : 'text-foreground-soft hover:bg-background'}`}
        >
          Todas ({eventos?.length ?? 0})
        </button>
        <button
          onClick={() => setAba('nao-lidas')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${aba === 'nao-lidas' ? 'bg-accent text-white' : 'text-foreground-soft hover:bg-background'}`}
        >
          Não lidas ({naoLidas})
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {erroAcao ? <p className="mb-4 text-sm text-danger">{erroAcao}</p> : null}
      {loading ? <p className="text-sm text-foreground-soft">Carregando…</p> : null}
      {!loading && !error && visiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-foreground-soft">
          {aba === 'nao-lidas' ? 'Nenhuma notificação pendente.' : 'Nenhuma notificação no momento.'}
        </p>
      ) : null}

      <div className="space-y-2">
        {visiveis.map((evento) => (
          <div
            key={evento.id}
            className={`rounded-xl border p-4 ${evento.lida ? 'border-line bg-card' : evento.important ? 'border-danger bg-danger-soft' : 'border-warn bg-warn-soft'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-semibold ${evento.lida ? 'text-foreground' : evento.important ? 'text-danger' : 'text-warn'}`}>{evento.title}</p>
                <p className="mt-0.5 text-sm text-foreground-soft">{evento.description}</p>
                <Link href={evento.link.href} className="mt-1 inline-block text-sm font-semibold text-accent hover:underline">
                  {evento.link.label}
                </Link>
              </div>
              {!evento.lida ? (
                <button
                  onClick={() => marcarLida(evento.id)}
                  disabled={processando === evento.id}
                  className="flex-shrink-0 whitespace-nowrap text-xs font-semibold text-accent hover:underline disabled:opacity-60"
                >
                  {processando === evento.id ? 'Marcando…' : 'Marcar como lida'}
                </button>
              ) : (
                <span className="flex-shrink-0 text-xs text-foreground-soft">Lida</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
