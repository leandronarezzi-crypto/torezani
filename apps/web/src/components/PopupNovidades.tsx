'use client';

import { useEffect, useState } from 'react';
import { CHANGELOG, VERSAO_ATUAL } from '@/lib/changelog';
import { formatDate } from '@/lib/format';

const STORAGE_KEY = 'torezani.versao-vista';

export function PopupNovidades() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) !== VERSAO_ATUAL) setAberto(true);
  }, []);

  if (!aberto) return null;

  const entrada = CHANGELOG[0];

  function fechar() {
    window.localStorage.setItem(STORAGE_KEY, VERSAO_ATUAL);
    setAberto(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6 print:hidden">
      <div className="w-full max-w-md rounded-xl bg-card shadow-xl">
        <div className="border-b border-line px-6 py-4">
          <p className="text-sm font-semibold text-accent">Atualização {entrada.versao} no sistema</p>
          <p className="text-xs text-foreground-soft">{formatDate(entrada.data)}</p>
        </div>
        <ul className="space-y-2 px-6 py-4">
          {entrada.itens.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
        <div className="flex justify-end border-t border-line px-6 py-4">
          <button onClick={fechar} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
            OK, entendi
          </button>
        </div>
      </div>
    </div>
  );
}
