'use client';

import type { FormEvent, ReactNode } from 'react';

export const CAMPO_CLASSE =
  'w-full rounded-md border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft';
export const LABEL_CLASSE = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-soft';

interface ModalCadastroProps {
  titulo: string;
  subtitulo?: string;
  onFechar: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  salvando?: boolean;
  textoSalvar?: string;
  largura?: string;
  erro?: string | null;
  children: ReactNode;
}

export function ModalCadastro({
  titulo,
  subtitulo,
  onFechar,
  onSubmit,
  salvando = false,
  textoSalvar = 'Salvar',
  largura = 'max-w-lg',
  erro,
  children,
}: ModalCadastroProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <form onSubmit={onSubmit} className={`flex w-full ${largura} max-h-[90vh] flex-col rounded-xl bg-card shadow-xl`}>
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{titulo}</h3>
            {subtitulo ? <p className="mt-0.5 text-sm text-foreground-soft">{subtitulo}</p> : null}
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-foreground-soft hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-4">
          {children}
          {erro ? <p className="text-sm text-danger">{erro}</p> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button type="button" onClick={onFechar} className="px-3 py-2 text-sm text-foreground-soft hover:text-foreground">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : textoSalvar}
          </button>
        </div>
      </form>
    </div>
  );
}
