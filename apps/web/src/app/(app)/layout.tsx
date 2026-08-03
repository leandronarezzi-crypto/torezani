'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSession } from '@/lib/useSession';
import { Sidebar } from '@/components/Sidebar';
import { PopupNovidades } from '@/components/PopupNovidades';
import { applyTheme, loadTheme } from '@/lib/theme';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status, session } = useSession();

  useEffect(() => {
    applyTheme(loadTheme());
  }, []);

  if (status !== 'authenticated' || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-foreground-soft">Carregando…</p>
      </div>
    );
  }

  return (
    <div className={`app-shell flex h-screen overflow-hidden bg-background ${session.papel === 'VISUALIZADOR' ? 'role-viewer' : ''}`}>
      <PopupNovidades />
      <Sidebar session={session} />
      <main className="app-main h-full flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
