'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from './api';
import { clearSession, loadSession, saveSession, type Session } from './session';

interface MeResponse {
  id: number;
  nome: string;
  email: string;
  papel: Session['papel'];
  status: Session['status'];
}

export function useSession() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const local = loadSession();
    if (!local) {
      setStatus('unauthenticated');
      router.replace('/login');
      return;
    }

    api
      .get<MeResponse>('/auth/me')
      .then((user) => {
        const refreshed: Session = { ...local, nome: user.nome, email: user.email, papel: user.papel, status: user.status };
        saveSession(refreshed);
        setSession(refreshed);
        setStatus('authenticated');
      })
      .catch((err) => {
        clearSession();
        setStatus('unauthenticated');
        router.replace(err instanceof ApiError && err.status === 403 ? '/login?motivo=acesso-revogado' : '/login');
      });
  }, [router]);

  return { status, session };
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearSession();
    router.replace('/login');
  };
}
