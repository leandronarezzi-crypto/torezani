'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NavIcon } from './NavIcon';
import { useFetch } from '@/lib/useFetch';
import { useLogout } from '@/lib/useSession';
import { applyTheme, loadTheme, type Theme } from '@/lib/theme';
import { initials } from '@/lib/format';
import { PAPEL_LABEL, type NotificationSummary } from '@/lib/types';
import type { Session } from '@/lib/session';

interface ItemNav {
  href: string;
  label: string;
  icone: string;
  adminOnly?: boolean;
}
interface GrupoNav {
  titulo: string;
  itens: ItemNav[];
}

const NAV_GROUPS: GrupoNav[] = [
  {
    titulo: 'Painel',
    itens: [
      { href: '/dashboard', label: 'Dashboard', icone: 'dashboard' },
      { href: '/notificacoes', label: 'Notificações', icone: 'notificacoes' },
    ],
  },
  {
    titulo: 'Frota',
    itens: [
      { href: '/embarcacoes', label: 'Embarcações', icone: 'embarcacoes' },
      { href: '/mapa', label: 'Mapa', icone: 'mapa' },
    ],
  },
  {
    titulo: 'Administração',
    itens: [{ href: '/usuarios', label: 'Usuários', icone: 'usuarios', adminOnly: true }],
  },
];

const COLLAPSE_KEY = 'torezani.sidebar.collapsed';

export function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname();
  const logout = useLogout();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const { data: summary } = useFetch<NotificationSummary>('/notifications/summary');

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    setTheme(loadTheme());
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
  }

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    itens: group.itens.filter((item) => !item.adminOnly || session.papel === 'ADMIN'),
  })).filter((group) => group.itens.length > 0);

  return (
    <aside
      className={`flex h-full flex-shrink-0 flex-col border-r border-line bg-card transition-[width] duration-150 ${collapsed ? 'w-16' : 'w-64'}`}
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo-mark.png" alt="Torezani" className="h-9 w-9 flex-shrink-0 rounded-lg bg-white object-contain p-1" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">Torezani</p>
            <p className="truncate text-xs text-foreground-soft">Apoio Marítimo</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.titulo} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-foreground-soft">{group.titulo}</p>
            )}
            {group.itens.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? 'bg-accent-soft text-accent' : 'text-foreground-soft hover:bg-background'
                  }`}
                >
                  <span className="relative flex-shrink-0">
                    <NavIcon name={item.icone} />
                    {item.href === '/notificacoes' && summary && summary.naoLidas > 0 ? (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                        {summary.naoLidas > 99 ? '99+' : summary.naoLidas}
                      </span>
                    ) : null}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground-soft hover:bg-background"
            title="Alternar tema"
          >
            {theme === 'dark' ? (collapsed ? '☀️' : '☀️ Claro') : collapsed ? '🌙' : '🌙 Escuro'}
          </button>
          <button
            onClick={toggleCollapsed}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-foreground-soft hover:bg-background"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {initials(session.nome)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{session.nome}</p>
              <p className="truncate text-[11px] text-foreground-soft">{PAPEL_LABEL[session.papel]}</p>
            </div>
          )}
          <button onClick={logout} title="Sair" className="flex-shrink-0 text-foreground-soft hover:text-danger">
            <NavIcon name="sair" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
