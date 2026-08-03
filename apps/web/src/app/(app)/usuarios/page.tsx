'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch } from '@/lib/useFetch';
import { useSession } from '@/lib/useSession';
import { api, ApiError } from '@/lib/api';
import { ModalCadastro, CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import { Badge } from '@/components/StatusDot';
import { PAPEL_LABEL, STATUS_USUARIO_LABEL, STATUS_USUARIO_TONE, type Papel, type StatusUsuario, type Usuario } from '@/lib/types';

export default function UsuariosPage() {
  const router = useRouter();
  const { status, session } = useSession();
  const { data: usuarios, loading, error, refetch } = useFetch<Usuario[]>(session?.papel === 'ADMIN' ? '/admin/usuarios' : null);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session && session.papel !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  if (status !== 'authenticated' || !session || session.papel !== 'ADMIN') {
    return <p className="text-sm text-foreground-soft">Carregando…</p>;
  }

  async function alterarPapel(usuario: Usuario, papel: Papel) {
    setErroAcao(null);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}`, { papel });
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível alterar o papel.');
      refetch();
    }
  }

  async function alterarStatus(usuario: Usuario, novoStatus: StatusUsuario) {
    setErroAcao(null);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}`, { status: novoStatus });
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível alterar o status.');
    }
  }

  async function excluirUsuario(usuario: Usuario) {
    if (!window.confirm(`Excluir a conta de ${usuario.nome} (${usuario.email})? Esta ação não pode ser desfeita.`)) return;
    setErroAcao(null);
    try {
      await api.delete(`/admin/usuarios/${usuario.id}`);
      refetch();
    } catch (err) {
      setErroAcao(err instanceof ApiError ? err.message : 'Não foi possível excluir o usuário.');
    }
  }

  async function salvarEdicao(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editando) return;
    setSalvando(true);
    setErroModal(null);
    const form = new FormData(e.currentTarget);
    const senha = String(form.get('senha') || '');
    try {
      await api.patch(`/admin/usuarios/${editando.id}`, {
        nome: form.get('nome'),
        email: form.get('email'),
        ...(senha ? { senha } : {}),
      });
      setEditando(null);
      refetch();
    } catch (err) {
      setErroModal(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="mt-1 text-sm text-foreground-soft">Aprove novos cadastros e gerencie o acesso da equipe.</p>
      </div>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {erroAcao ? <p className="mb-4 text-sm text-danger">{erroAcao}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-foreground-soft">
                  Carregando…
                </td>
              </tr>
            ) : (
              usuarios?.map((u) => {
                const isSelf = u.id === session.userId;
                return (
                  <tr key={u.id} className="border-t border-line last:border-0 hover:bg-background">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {u.nome} {isSelf ? <Badge>você</Badge> : null}
                    </td>
                    <td className="px-4 py-3 text-foreground-soft">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_USUARIO_TONE[u.status]}>{STATUS_USUARIO_LABEL[u.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.papel}
                        disabled={isSelf}
                        onChange={(e) => alterarPapel(u, e.target.value as Papel)}
                        className="rounded-md border border-line bg-card px-2 py-1.5 text-sm text-foreground disabled:opacity-60"
                      >
                        {Object.entries(PAPEL_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right">
                      <button onClick={() => setEditando(u)} className="text-xs font-semibold text-accent hover:underline">
                        Editar
                      </button>
                      {u.status !== 'APROVADO' ? (
                        <button disabled={isSelf} onClick={() => alterarStatus(u, 'APROVADO')} className="text-xs font-semibold text-success hover:underline disabled:opacity-40">
                          Aprovar
                        </button>
                      ) : null}
                      {u.status !== 'REJEITADO' ? (
                        <button disabled={isSelf} onClick={() => alterarStatus(u, 'REJEITADO')} className="text-xs font-semibold text-danger hover:underline disabled:opacity-40">
                          Bloquear
                        </button>
                      ) : null}
                      <button disabled={isSelf} onClick={() => excluirUsuario(u)} className="text-xs font-semibold text-danger hover:underline disabled:opacity-40">
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editando ? (
        <ModalCadastro titulo="Editar Usuário" subtitulo={editando.nome} onFechar={() => setEditando(null)} onSubmit={salvarEdicao} salvando={salvando} erro={erroModal}>
          <div>
            <label className={LABEL_CLASSE}>Nome</label>
            <input name="nome" required defaultValue={editando.nome} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>E-mail</label>
            <input type="email" name="email" required defaultValue={editando.email} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Nova senha</label>
            <input type="password" name="senha" minLength={6} placeholder="Deixe em branco para manter a atual" className={CAMPO_CLASSE} />
            <p className="mt-1 text-xs text-foreground-soft">Preencha apenas se quiser trocar a senha deste usuário.</p>
          </div>
        </ModalCadastro>
      ) : null}
    </div>
  );
}
