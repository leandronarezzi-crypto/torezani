const STORAGE_KEY = 'torezani.session';

export type Papel = 'ADMIN' | 'EDITOR' | 'VISUALIZADOR';
export type StatusUsuario = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

export interface Session {
  accessToken: string;
  userId: number;
  nome: string;
  email: string;
  papel: Papel;
  status: StatusUsuario;
}

export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
