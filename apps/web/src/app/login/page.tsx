'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { clearSession, loadSession, saveSession } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [aviso, setAviso] = useState<string | null>(null);
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [erroRegistro, setErroRegistro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('motivo') === 'acesso-revogado') {
      setAviso('Sua sessão foi encerrada porque seu acesso não está mais liberado.');
    }
  }, []);

  useEffect(() => {
    if (!loadSession()) return;
    api
      .get('/auth/me')
      .then(() => router.replace('/dashboard'))
      .catch(() => clearSession());
  }, [router]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroLogin(null);
    setEntrando(true);
    const form = new FormData(e.currentTarget);
    try {
      const session = await api.post<{
        accessToken: string;
        userId: number;
        nome: string;
        email: string;
        papel: 'ADMIN' | 'EDITOR' | 'VISUALIZADOR';
        status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
      }>(
        '/auth/login',
        { email: form.get('email'), senha: form.get('senha') },
        false,
      );
      saveSession(session);
      router.replace('/dashboard');
    } catch (err) {
      setErroLogin(err instanceof ApiError ? err.message : 'Não foi possível entrar.');
    } finally {
      setEntrando(false);
    }
  }

  async function handleRegistro(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroRegistro(null);
    setRegistrando(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post(
        '/auth/registrar',
        { nome: form.get('nome'), email: form.get('email'), senha: form.get('senha') },
        false,
      );
      e.currentTarget.reset();
      setModo('login');
      setAviso('Conta criada! Assim que um administrador liberar seu acesso, você poderá entrar.');
    } catch (err) {
      setErroRegistro(err instanceof ApiError ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border border-line bg-card p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo-full.jpg" alt="Torezani Apoio Marítimo" className="mb-3 max-w-[220px] rounded-lg" />
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-soft">Gerenciamento de embarcações</p>
        </div>

        {aviso ? <p className="mb-4 rounded-lg border border-success bg-success-soft px-3 py-2 text-sm text-success">{aviso}</p> : null}

        {modo === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <h1 className="text-lg font-bold text-foreground">Entrar</h1>
            {erroLogin ? <p className="text-sm text-danger">{erroLogin}</p> : null}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-soft">E-mail</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-soft">Senha</label>
              <input
                name="senha"
                type="password"
                required
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <button
              type="submit"
              disabled={entrando}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
            >
              {entrando ? 'Entrando…' : 'Entrar'}
            </button>
            <p className="text-center text-sm text-foreground-soft">
              Primeira vez por aqui?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setAviso(null);
                  setModo('registro');
                }}
                className="font-semibold text-accent hover:underline"
              >
                Cadastre sua conta
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegistro} className="flex flex-col gap-4">
            <h1 className="text-lg font-bold text-foreground">Criar conta</h1>
            {erroRegistro ? <p className="text-sm text-danger">{erroRegistro}</p> : null}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-soft">Nome</label>
              <input
                name="nome"
                required
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-soft">E-mail</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-soft">Senha</label>
              <input
                name="senha"
                type="password"
                required
                minLength={6}
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <button
              type="submit"
              disabled={registrando}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
            >
              {registrando ? 'Criando…' : 'Criar conta'}
            </button>
            <p className="text-center text-sm text-foreground-soft">
              Já tem conta?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setAviso(null);
                  setModo('login');
                }}
                className="font-semibold text-accent hover:underline"
              >
                Entrar
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
