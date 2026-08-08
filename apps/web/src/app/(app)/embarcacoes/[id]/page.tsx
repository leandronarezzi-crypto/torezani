'use client';

import { Fragment, use, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import { ModalCadastro, CAMPO_CLASSE, LABEL_CLASSE } from '@/components/ModalCadastro';
import { Badge, StatusDot } from '@/components/StatusDot';
import { formatDate, formatNumber } from '@/lib/format';
import {
  POSICAO_LABEL,
  TIPO_CONFIGURACAO_LABEL,
  TIPO_MANUTENCAO_LABEL,
  TIPO_MANUTENCAO_TONE,
  type AuditoriaResumo,
  type Correia,
  type EmbarcacaoDetalhada,
  type ManutencaoCascoPintura,
  type ManutencaoPreventiva,
  type MotorDetalhado,
  type OrdemServico,
  type TipoManutencao,
} from '@/lib/types';

const TIPOS_MANUTENCAO: TipoManutencao[] = ['PREVENTIVA', 'PREDITIVA', 'CORRETIVA'];

export default function EmbarcacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, loading, error, refetch } = useFetch<EmbarcacaoDetalhada>(`/embarcacoes/${id}/detail`);
  const [activeMotorId, setActiveMotorId] = useState<number | null>(null);

  useEffect(() => {
    if (!data) return;
    if (!activeMotorId || !data.motores.some((m) => m.id === activeMotorId)) {
      setActiveMotorId(data.motores[0]?.id ?? null);
    }
  }, [data, activeMotorId]);

  async function excluirEmbarcacao() {
    if (!data) return;
    if (!window.confirm(`Excluir "${data.nome}" e todo o seu histórico permanentemente?`)) return;
    await api.delete(`/embarcacoes/${data.id}`);
    router.push('/embarcacoes');
  }

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (loading || !data) return <p className="text-sm text-foreground-soft">Carregando…</p>;

  const motor = data.motores.find((m) => m.id === activeMotorId) ?? null;

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-soft">
            <Link href="/embarcacoes" className="hover:underline">
              Embarcações
            </Link>{' '}
            / {data.nome}
          </p>
          <h1 className="text-2xl font-bold text-foreground">{data.nome}</h1>
          <span className="mt-1 inline-block">
            <Badge>{TIPO_CONFIGURACAO_LABEL[data.tipoConfiguracao]}</Badge>
          </span>
        </div>
        <div className="flex flex-shrink-0 gap-3">
          <Link
            href={`/embarcacoes/${data.id}/editar`}
            className="write-only rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-background"
          >
            Editar
          </Link>
          <button onClick={excluirEmbarcacao} className="write-only px-3 py-2 text-sm font-semibold text-danger hover:underline">
            Excluir Embarcação
          </button>
        </div>
      </div>

      {data.motores.length > 1 ? (
        <div className="mb-4 flex gap-1 rounded-lg border border-line p-0.5" style={{ width: 'fit-content' }}>
          {data.motores.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMotorId(m.id)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                m.id === activeMotorId ? 'bg-accent text-white' : 'text-foreground-soft hover:bg-background'
              }`}
            >
              {POSICAO_LABEL[m.posicao]}
            </button>
          ))}
        </div>
      ) : null}

      {motor ? <EnginePanel key={motor.id} motor={motor} refetch={refetch} /> : null}

      <CascoPinturaSection embarcacaoId={data.id} itens={data.cascoPintura} refetch={refetch} />

      <AuditoriasSection embarcacaoId={data.id} />
    </div>
  );
}

// --- Auditorias (checklist de manutenção) ---------------------------------------

function AuditoriasSection({ embarcacaoId }: { embarcacaoId: number }) {
  const { data: auditorias, loading, error } = useFetch<AuditoriaResumo[]>(`/embarcacoes/${embarcacaoId}/auditorias`);

  return (
    <section className="mt-6">
      <div className="rounded-xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Auditorias</h2>
            <p className="text-xs text-foreground-soft">Checklist de manutenção preventiva realizado em campo.</p>
          </div>
          <Link
            href={`/embarcacoes/${embarcacaoId}/auditoria/nova`}
            className="write-only rounded px-2 py-1 text-xs font-semibold text-accent hover:bg-accent-soft"
          >
            + Nova Auditoria
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Itens</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-danger">
                    {error}
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-foreground-soft">
                    Carregando…
                  </td>
                </tr>
              ) : !auditorias?.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-foreground-soft">
                    Nenhuma auditoria realizada ainda.
                  </td>
                </tr>
              ) : (
                auditorias.map((a) => (
                  <tr key={a.id} className="border-t border-line last:border-0 hover:bg-background">
                    <td className="px-4 py-3">{formatDate(a.dataRealizacao)}</td>
                    <td className="px-4 py-3">{a.responsavel}</td>
                    <td className="px-4 py-3">{a.totalItens}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/embarcacoes/${embarcacaoId}/auditoria/${a.id}`} className="text-xs font-semibold text-accent hover:underline">
                        Ver relatório
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// --- Painel do motor ativo -------------------------------------------------

function EnginePanel({ motor, refetch }: { motor: MotorDetalhado; refetch: () => void }) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <SpecsCard motor={motor} refetch={refetch} />
        <GearboxCard motor={motor} refetch={refetch} />
        <ShaftCard motor={motor} refetch={refetch} />
        <BeltsCard motor={motor} refetch={refetch} />
      </div>
      <MaintenanceCard motor={motor} refetch={refetch} />
    </>
  );
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// --- Especificações do motor + horímetro -----------------------------------

function SpecsCard({ motor, refetch }: { motor: MotorDetalhado; refetch: () => void }) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalHorimetro, setModalHorimetro] = useState(false);
  const [salvandoHorimetro, setSalvandoHorimetro] = useState(false);
  const [erroHorimetro, setErroHorimetro] = useState<string | null>(null);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const form = new FormData(e.currentTarget);
    try {
      await api.put(`/motores/${motor.id}`, {
        marca: form.get('marca'),
        modelo: form.get('modelo'),
        potenciaConfig: form.get('potenciaConfig'),
        numSerie: form.get('numSerie'),
      });
      refetch();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarHorimetro(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvandoHorimetro(true);
    setErroHorimetro(null);
    const form = new FormData(e.currentTarget);
    try {
      await api.patch(`/motores/${motor.id}/horimetro`, { horimetroAtual: Number(form.get('horimetroAtual')) });
      setModalHorimetro(false);
      refetch();
    } catch (err) {
      setErroHorimetro(err instanceof ApiError ? err.message : 'Não foi possível atualizar o horímetro.');
    } finally {
      setSalvandoHorimetro(false);
    }
  }

  return (
    <Card
      title="Especificações do Motor"
      action={
        <button
          onClick={() => setModalHorimetro(true)}
          className="write-only rounded px-2 py-1 text-xs font-semibold text-accent hover:bg-accent-soft"
        >
          Atualizar Horímetro
        </button>
      }
    >
      <p className="mb-3 text-sm text-foreground-soft">
        Horímetro atual: <span className="font-bold text-foreground">{formatNumber(motor.horimetroAtual)} h</span>
      </p>
      <form onSubmit={salvar} className="space-y-3">
        {erro ? <p className="text-sm text-danger">{erro}</p> : null}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASSE}>Marca</label>
            <input name="marca" defaultValue={motor.marca ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Modelo</label>
            <input name="modelo" defaultValue={motor.modelo ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Potência</label>
            <input name="potenciaConfig" defaultValue={motor.potenciaConfig ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Nº de Série</label>
            <input name="numSerie" defaultValue={motor.numSerie ?? ''} className={CAMPO_CLASSE} />
          </div>
        </div>
        <button type="submit" disabled={salvando} className="write-only rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-60">
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </form>

      {modalHorimetro ? (
        <ModalCadastro
          titulo={`Atualizar Horímetro — ${POSICAO_LABEL[motor.posicao]}`}
          subtitulo={`Valor atual: ${formatNumber(motor.horimetroAtual)} h. O novo valor deve ser maior ou igual ao atual.`}
          onFechar={() => setModalHorimetro(false)}
          onSubmit={salvarHorimetro}
          salvando={salvandoHorimetro}
          erro={erroHorimetro}
        >
          <div>
            <label className={LABEL_CLASSE}>Novo Horímetro</label>
            <input type="number" step="0.01" min={0} name="horimetroAtual" required defaultValue={motor.horimetroAtual} className={CAMPO_CLASSE} />
          </div>
        </ModalCadastro>
      ) : null}
    </Card>
  );
}

// --- Caixa reversora ---------------------------------------------------------

function GearboxCard({ motor, refetch }: { motor: MotorDetalhado; refetch: () => void }) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const cr = motor.caixaReversora;

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const form = new FormData(e.currentTarget);
    try {
      await api.put(`/motores/${motor.id}/caixa-reversora`, {
        marca: form.get('marca'),
        modelo: form.get('modelo'),
        ratio: form.get('ratio'),
      });
      refetch();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card title="Caixa Reversora">
      <form onSubmit={salvar} className="space-y-3">
        {erro ? <p className="text-sm text-danger">{erro}</p> : null}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASSE}>Marca</label>
            <input name="marca" defaultValue={cr?.marca ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Modelo</label>
            <input name="modelo" defaultValue={cr?.modelo ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div className="col-span-2">
            <label className={LABEL_CLASSE}>Ratio (Redução)</label>
            <input name="ratio" defaultValue={cr?.ratio ?? ''} className={CAMPO_CLASSE} />
          </div>
        </div>
        <button type="submit" disabled={salvando} className="write-only rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-60">
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </Card>
  );
}

// --- Sistema eixo / hélice ----------------------------------------------------

function ShaftCard({ motor, refetch }: { motor: MotorDetalhado; refetch: () => void }) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const eh = motor.sistemaEixoHelice;

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const form = new FormData(e.currentTarget);
    const numPas = form.get('numPas');
    try {
      await api.put(`/motores/${motor.id}/sistema-eixo-helice`, {
        diametroHelice: form.get('diametroHelice'),
        passoHelice: form.get('passoHelice'),
        numPas: numPas ? Number(numPas) : undefined,
        diametroEixo: form.get('diametroEixo'),
        grauCone: form.get('grauCone'),
        comprimentoCone: form.get('comprimentoCone'),
      });
      refetch();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card title="Sistema Eixo / Hélice">
      <form onSubmit={salvar} className="space-y-3">
        {erro ? <p className="text-sm text-danger">{erro}</p> : null}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASSE}>Diâmetro Hélice</label>
            <input name="diametroHelice" defaultValue={eh?.diametroHelice ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Passo Hélice</label>
            <input name="passoHelice" defaultValue={eh?.passoHelice ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Nº de Pás</label>
            <input type="number" name="numPas" defaultValue={eh?.numPas ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Diâmetro Eixo</label>
            <input name="diametroEixo" defaultValue={eh?.diametroEixo ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Grau do Cone</label>
            <input name="grauCone" defaultValue={eh?.grauCone ?? ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Comprimento Cone</label>
            <input name="comprimentoCone" defaultValue={eh?.comprimentoCone ?? ''} className={CAMPO_CLASSE} />
          </div>
        </div>
        <button type="submit" disabled={salvando} className="write-only rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-60">
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </Card>
  );
}

// --- Correias -----------------------------------------------------------------

type EstadoModalCorreia = { modo: 'novo' } | { modo: 'editar'; correia: Correia } | null;

function BeltsCard({ motor, refetch }: { motor: MotorDetalhado; refetch: () => void }) {
  const [modal, setModal] = useState<EstadoModalCorreia>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    setSalvando(true);
    setErro(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      funcaoAplicacao: form.get('funcaoAplicacao'),
      especificacaoTamanho: form.get('especificacaoTamanho'),
      quantidade: Number(form.get('quantidade')) || 1,
    };
    try {
      if (modal.modo === 'novo') {
        await api.post(`/motores/${motor.id}/correias`, payload);
      } else {
        await api.put(`/correias/${modal.correia.id}`, payload);
      }
      setModal(null);
      refetch();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a correia.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(correia: Correia) {
    if (!window.confirm('Excluir esta correia?')) return;
    await api.delete(`/correias/${correia.id}`);
    refetch();
  }

  return (
    <Card
      title="Correias"
      action={
        <button
          onClick={() => setModal({ modo: 'novo' })}
          className="write-only rounded px-2 py-1 text-xs font-semibold text-accent hover:bg-accent-soft"
        >
          + Adicionar
        </button>
      }
    >
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-foreground-soft">
          <tr>
            <th className="py-1">Função</th>
            <th className="py-1">Especificação</th>
            <th className="py-1">Qtd</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {motor.correias.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-sm text-foreground-soft">
                Nenhuma correia cadastrada.
              </td>
            </tr>
          ) : (
            motor.correias.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="py-2">{c.funcaoAplicacao}</td>
                <td className="py-2">{c.especificacaoTamanho}</td>
                <td className="py-2">{c.quantidade}</td>
                <td className="space-x-2 whitespace-nowrap py-2 text-right">
                  <button onClick={() => setModal({ modo: 'editar', correia: c })} className="write-only text-xs text-foreground-soft hover:text-accent">
                    Editar
                  </button>
                  <button onClick={() => excluir(c)} className="write-only text-xs text-danger hover:underline">
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modal ? (
        <ModalCadastro
          titulo={modal.modo === 'novo' ? 'Nova Correia' : 'Editar Correia'}
          onFechar={() => setModal(null)}
          onSubmit={salvar}
          salvando={salvando}
          erro={erro}
        >
          <div>
            <label className={LABEL_CLASSE}>Função / Aplicação</label>
            <input name="funcaoAplicacao" required defaultValue={modal.modo === 'editar' ? modal.correia.funcaoAplicacao ?? '' : ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Especificação / Tamanho</label>
            <input
              name="especificacaoTamanho"
              defaultValue={modal.modo === 'editar' ? modal.correia.especificacaoTamanho ?? '' : ''}
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Quantidade</label>
            <input type="number" min={1} name="quantidade" defaultValue={modal.modo === 'editar' ? modal.correia.quantidade : 1} className={CAMPO_CLASSE} />
          </div>
        </ModalCadastro>
      ) : null}
    </Card>
  );
}

// --- Manutenção preventiva -----------------------------------------------------

type EstadoModalManutencao = { modo: 'novo' } | { modo: 'editar'; manutencao: ManutencaoPreventiva } | null;

function MaintenanceCard({ motor, refetch }: { motor: MotorDetalhado; refetch: () => void }) {
  const router = useRouter();
  const [modal, setModal] = useState<EstadoModalManutencao>(null);
  const [tipoForm, setTipoForm] = useState<TipoManutencao>('PREVENTIVA');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [modalRegistro, setModalRegistro] = useState<ManutencaoPreventiva | null>(null);
  const [salvandoRegistro, setSalvandoRegistro] = useState(false);
  const [erroRegistro, setErroRegistro] = useState<string | null>(null);
  const [gerandoOsId, setGerandoOsId] = useState<number | null>(null);

  useEffect(() => {
    setTipoForm(modal?.modo === 'editar' ? modal.manutencao.tipo : 'PREVENTIVA');
  }, [modal]);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    setSalvando(true);
    setErro(null);
    const form = new FormData(e.currentTarget);
    const tipo = form.get('tipo') as TipoManutencao;
    const payload: Record<string, unknown> = {
      tipoServico: form.get('tipoServico'),
      tipo,
      horimetroUltimaTroca: Number(form.get('horimetroUltimaTroca')) || 0,
    };
    if (tipo === 'PREVENTIVA') {
      payload.intervaloHoras = Number(form.get('intervaloHoras'));
      payload.alertaLimiteHoras = Number(form.get('alertaLimiteHoras')) || 0;
    } else if (modal.modo === 'novo') {
      // So no cadastro: Preditiva/Corretiva ja nascem com o evento registrado.
      payload.dataExecucao = form.get('dataExecucao') || undefined;
      payload.observacoes = form.get('observacoes') || undefined;
      payload.custo = form.get('custo') ? Number(form.get('custo')) : undefined;
      payload.fornecedor = form.get('fornecedor') || undefined;
    }
    try {
      if (modal.modo === 'novo') {
        await api.post(`/motores/${motor.id}/manutencoes`, payload);
      } else {
        await api.put(`/manutencoes/${modal.manutencao.id}`, payload);
      }
      setModal(null);
      refetch();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a manutenção.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(m: ManutencaoPreventiva) {
    if (!window.confirm('Excluir este item de manutenção?')) return;
    await api.delete(`/manutencoes/${m.id}`);
    refetch();
  }

  async function gerarOs(m: ManutencaoPreventiva) {
    setGerandoOsId(m.id);
    try {
      const os = await api.post<OrdemServico>('/ordens-servico', { manutencaoId: m.id });
      router.push(`/ordens-servico/${os.id}`);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Não foi possível gerar a ordem de serviço.');
      setGerandoOsId(null);
    }
  }

  async function salvarRegistro(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modalRegistro) return;
    setSalvandoRegistro(true);
    setErroRegistro(null);
    const form = new FormData(e.currentTarget);
    try {
      await api.patch(`/manutencoes/${modalRegistro.id}/registrar-servico`, {
        horimetro: form.get('horimetro') ? Number(form.get('horimetro')) : undefined,
        dataExecucao: form.get('dataExecucao') || undefined,
        observacoes: form.get('observacoes') || undefined,
        custo: form.get('custo') ? Number(form.get('custo')) : undefined,
        fornecedor: form.get('fornecedor') || undefined,
      });
      setModalRegistro(null);
      refetch();
    } catch (err) {
      setErroRegistro(err instanceof ApiError ? err.message : 'Não foi possível registrar o serviço.');
    } finally {
      setSalvandoRegistro(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Manutenção</h3>
        <button
          onClick={() => setModal({ modo: 'novo' })}
          className="write-only rounded px-2 py-1 text-xs font-semibold text-accent hover:bg-accent-soft"
        >
          + Nova Manutenção
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-foreground-soft">
            <tr>
              <th className="py-1 pr-4">Serviço</th>
              <th className="py-1 pr-4">Tipo</th>
              <th className="py-1 pr-4 whitespace-nowrap">Última</th>
              <th className="py-1 pr-4 whitespace-nowrap">Intervalo</th>
              <th className="py-1 pr-4 whitespace-nowrap">Próxima</th>
              <th className="py-1 pr-4 whitespace-nowrap">Restam</th>
              <th className="py-1 pr-4">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {motor.manutencoes.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-4 text-center text-sm text-foreground-soft">
                  Nenhuma manutenção cadastrada.
                </td>
              </tr>
            ) : (
              motor.manutencoes.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="py-2 pr-4">{m.tipoServico}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <Badge tone={TIPO_MANUTENCAO_TONE[m.tipo]}>{TIPO_MANUTENCAO_LABEL[m.tipo]}</Badge>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatNumber(m.horimetroUltimaTroca)} h</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{m.intervaloHoras != null ? `${m.intervaloHoras} h` : '—'}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{m.proximaTroca != null ? `${formatNumber(m.proximaTroca)} h` : '—'}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{m.horasRestantes != null ? `${formatNumber(m.horasRestantes)} h` : '—'}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <StatusDot status={m.status} />
                  </td>
                  <td className="space-x-2 whitespace-nowrap py-2 text-right">
                    <button onClick={() => setModalRegistro(m)} className="write-only text-xs font-semibold text-success hover:underline">
                      Registrar Serviço
                    </button>
                    {m.tipo !== 'CORRETIVA' ? (
                      <button
                        onClick={() => gerarOs(m)}
                        disabled={gerandoOsId === m.id}
                        className="write-only text-xs font-semibold text-accent hover:underline disabled:opacity-50"
                      >
                        {gerandoOsId === m.id ? 'Gerando…' : 'Gerar OS'}
                      </button>
                    ) : null}
                    <button onClick={() => setModal({ modo: 'editar', manutencao: m })} className="write-only text-xs text-foreground-soft hover:text-accent">
                      Editar
                    </button>
                    <button onClick={() => excluir(m)} className="write-only text-xs text-danger hover:underline">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal ? (
        <ModalCadastro
          titulo={modal.modo === 'novo' ? 'Nova Manutenção' : 'Editar Manutenção'}
          onFechar={() => setModal(null)}
          onSubmit={salvar}
          salvando={salvando}
          erro={erro}
        >
          <div>
            <label className={LABEL_CLASSE}>Tipo de Serviço</label>
            <input
              name="tipoServico"
              required
              placeholder="Ex: Óleo do motor, Filtro diesel, Vazamento na bomba"
              defaultValue={modal.modo === 'editar' ? modal.manutencao.tipoServico : ''}
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Tipo</label>
            <select name="tipo" value={tipoForm} onChange={(e) => setTipoForm(e.target.value as TipoManutencao)} className={CAMPO_CLASSE}>
              {TIPOS_MANUTENCAO.map((t) => (
                <option key={t} value={t}>
                  {TIPO_MANUTENCAO_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASSE}>
              {tipoForm === 'PREVENTIVA' ? 'Horímetro da Última Troca' : tipoForm === 'PREDITIVA' ? 'Horímetro da Última Inspeção' : 'Horímetro no Momento'}
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              name="horimetroUltimaTroca"
              defaultValue={modal.modo === 'editar' ? modal.manutencao.horimetroUltimaTroca : motor.horimetroAtual}
              className={CAMPO_CLASSE}
            />
          </div>

          {tipoForm !== 'CORRETIVA' ? (
            <Fragment key="agendada">
              <div>
                <label className={LABEL_CLASSE}>{tipoForm === 'PREDITIVA' ? 'Intervalo entre inspeções (horas)' : 'Intervalo (horas)'}</label>
                <input
                  type="number"
                  min={1}
                  name="intervaloHoras"
                  required
                  defaultValue={modal.modo === 'editar' ? (modal.manutencao.intervaloHoras ?? '') : ''}
                  className={CAMPO_CLASSE}
                />
              </div>
              <div>
                <label className={LABEL_CLASSE}>Alertar quando faltar (horas)</label>
                <input
                  type="number"
                  min={0}
                  name="alertaLimiteHoras"
                  defaultValue={modal.modo === 'editar' ? modal.manutencao.alertaLimiteHoras : 50}
                  className={CAMPO_CLASSE}
                />
              </div>
            </Fragment>
          ) : modal.modo === 'novo' ? (
            <Fragment key="evento">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASSE}>Data</label>
                  <input type="date" name="dataExecucao" defaultValue={new Date().toISOString().slice(0, 10)} className={CAMPO_CLASSE} />
                </div>
                <div>
                  <label className={LABEL_CLASSE}>Custo</label>
                  <input type="number" step="0.01" min={0} name="custo" className={CAMPO_CLASSE} />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASSE}>Fornecedor / Oficina</label>
                <input name="fornecedor" className={CAMPO_CLASSE} />
              </div>
              <div>
                <label className={LABEL_CLASSE}>O que aconteceu / foi feito</label>
                <textarea name="observacoes" rows={3} className={CAMPO_CLASSE} />
              </div>
              <p className="text-xs text-foreground-soft">Se o custo for informado, uma Despesa é gerada automaticamente no Financeiro.</p>
            </Fragment>
          ) : null}
        </ModalCadastro>
      ) : null}

      {modalRegistro ? (
        <ModalCadastro
          titulo={`Registrar Serviço — ${modalRegistro.tipoServico}`}
          subtitulo={`Horímetro atual do motor: ${formatNumber(motor.horimetroAtual)} h`}
          onFechar={() => setModalRegistro(null)}
          onSubmit={salvarRegistro}
          salvando={salvandoRegistro}
          erro={erroRegistro}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASSE}>Horímetro</label>
              <input type="number" step="0.01" min={0} name="horimetro" defaultValue={motor.horimetroAtual} className={CAMPO_CLASSE} />
            </div>
            <div>
              <label className={LABEL_CLASSE}>Data</label>
              <input type="date" name="dataExecucao" defaultValue={new Date().toISOString().slice(0, 10)} className={CAMPO_CLASSE} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLASSE}>Observações</label>
            <textarea name="observacoes" rows={2} className={CAMPO_CLASSE} />
          </div>
          {modalRegistro.tipo !== 'PREVENTIVA' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASSE}>Custo</label>
                <input type="number" step="0.01" min={0} name="custo" className={CAMPO_CLASSE} />
                <p className="mt-1 text-xs text-foreground-soft">Se informado, gera uma despesa automaticamente.</p>
              </div>
              <div>
                <label className={LABEL_CLASSE}>Fornecedor / Oficina</label>
                <input name="fornecedor" className={CAMPO_CLASSE} />
              </div>
            </div>
          ) : null}
        </ModalCadastro>
      ) : null}
    </div>
  );
}

// --- Casco / Pintura (nível da embarcação) --------------------------------------

type EstadoModalCascoPintura = { modo: 'novo' } | { modo: 'editar'; item: ManutencaoCascoPintura } | null;

function CascoPinturaSection({
  embarcacaoId,
  itens,
  refetch,
}: {
  embarcacaoId: number;
  itens: ManutencaoCascoPintura[];
  refetch: () => void;
}) {
  const [modal, setModal] = useState<EstadoModalCascoPintura>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    setSalvando(true);
    setErro(null);
    const form = new FormData(e.currentTarget);
    const dataExecucao = form.get('dataExecucao');
    const alertaVencimentoData = form.get('alertaVencimentoData');
    const horimetroEmbarcacao = form.get('horimetroEmbarcacao');
    const payload = {
      tipoIntervencao: form.get('tipoIntervencao'),
      dataExecucao: dataExecucao ? String(dataExecucao) : undefined,
      horimetroEmbarcacao: horimetroEmbarcacao ? Number(horimetroEmbarcacao) : undefined,
      esquemaProdutos: form.get('esquemaProdutos'),
      historicoObservacoes: form.get('historicoObservacoes'),
      alertaVencimentoData: alertaVencimentoData ? String(alertaVencimentoData) : undefined,
    };
    try {
      if (modal.modo === 'novo') {
        await api.post(`/embarcacoes/${embarcacaoId}/casco-pintura`, payload);
      } else {
        await api.put(`/casco-pintura/${modal.item.id}`, payload);
      }
      setModal(null);
      refetch();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar o registro.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(item: ManutencaoCascoPintura) {
    if (!window.confirm('Excluir este registro de casco/pintura?')) return;
    await api.delete(`/casco-pintura/${item.id}`);
    refetch();
  }

  return (
    <section className="mt-6">
      <div className="rounded-xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Casco / Pintura</h2>
          <button
            onClick={() => setModal({ modo: 'novo' })}
            className="write-only rounded px-2 py-1 text-xs font-semibold text-accent hover:bg-accent-soft"
          >
            + Novo Registro
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase tracking-wide text-foreground-soft">
              <tr>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Execução</th>
                <th className="px-4 py-3">Horímetro</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-foreground-soft">
                    Nenhum registro de casco/pintura ainda.
                  </td>
                </tr>
              ) : (
                itens.map((c) => (
                  <tr key={c.id} className="border-t border-line last:border-0 hover:bg-background">
                    <td className="px-4 py-3">{c.tipoIntervencao === 'CASCO' ? 'Casco' : 'Pintura'}</td>
                    <td className="px-4 py-3">{formatDate(c.dataExecucao)}</td>
                    <td className="px-4 py-3">{c.horimetroEmbarcacao != null ? `${formatNumber(c.horimetroEmbarcacao)} h` : '—'}</td>
                    <td className="px-4 py-3">{formatDate(c.alertaVencimentoData)}</td>
                    <td className="px-4 py-3">
                      <StatusDot status={c.status} />
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                      <button onClick={() => setModal({ modo: 'editar', item: c })} className="write-only text-xs text-foreground-soft hover:text-accent">
                        Editar
                      </button>
                      <button onClick={() => excluir(c)} className="write-only text-xs text-danger hover:underline">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal ? (
        <ModalCadastro
          titulo={modal.modo === 'novo' ? 'Novo Registro de Casco/Pintura' : 'Editar Registro de Casco/Pintura'}
          onFechar={() => setModal(null)}
          onSubmit={salvar}
          salvando={salvando}
          erro={erro}
        >
          <div>
            <label className={LABEL_CLASSE}>Tipo de Intervenção</label>
            <select name="tipoIntervencao" required defaultValue={modal.modo === 'editar' ? modal.item.tipoIntervencao : 'CASCO'} className={CAMPO_CLASSE}>
              <option value="CASCO">Casco</option>
              <option value="PINTURA">Pintura</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASSE}>Data de Execução</label>
              <input
                type="date"
                name="dataExecucao"
                defaultValue={modal.modo === 'editar' ? modal.item.dataExecucao?.substring(0, 10) : ''}
                className={CAMPO_CLASSE}
              />
            </div>
            <div>
              <label className={LABEL_CLASSE}>Horímetro da Embarcação</label>
              <input
                type="number"
                step="0.01"
                name="horimetroEmbarcacao"
                defaultValue={modal.modo === 'editar' ? modal.item.horimetroEmbarcacao ?? '' : ''}
                className={CAMPO_CLASSE}
              />
            </div>
          </div>
          <div>
            <label className={LABEL_CLASSE}>Esquema de Produtos</label>
            <textarea name="esquemaProdutos" rows={2} defaultValue={modal.modo === 'editar' ? modal.item.esquemaProdutos ?? '' : ''} className={CAMPO_CLASSE} />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Observações</label>
            <textarea
              name="historicoObservacoes"
              rows={2}
              defaultValue={modal.modo === 'editar' ? modal.item.historicoObservacoes ?? '' : ''}
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className={LABEL_CLASSE}>Data de Vencimento do Alerta</label>
            <input
              type="date"
              name="alertaVencimentoData"
              defaultValue={modal.modo === 'editar' ? modal.item.alertaVencimentoData?.substring(0, 10) : ''}
              className={CAMPO_CLASSE}
            />
            <p className="mt-1 text-xs text-foreground-soft">Ex: validade de tinta anti-incrustante (geralmente 36 meses).</p>
          </div>
        </ModalCadastro>
      ) : null}
    </section>
  );
}
