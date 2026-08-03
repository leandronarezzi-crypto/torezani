export type TipoConfiguracao = 'MONOMOTOR' | 'BIMOTOR';
export const TIPO_CONFIGURACAO_LABEL: Record<TipoConfiguracao, string> = {
  MONOMOTOR: 'Monomotor',
  BIMOTOR: 'Bimotor',
};

export type PosicaoMotor = 'MONO' | 'BORE_BABOR' | 'ESTIBORDO';
export const POSICAO_LABEL: Record<PosicaoMotor, string> = {
  MONO: 'Mono',
  BORE_BABOR: 'Bore/Babor',
  ESTIBORDO: 'Estibordo',
};

export type TipoIntervencao = 'CASCO' | 'PINTURA';
export const TIPO_INTERVENCAO_LABEL: Record<TipoIntervencao, string> = {
  CASCO: 'Casco',
  PINTURA: 'Pintura',
};

export type StatusAlerta = 'VENCIDO' | 'ALERTA' | 'OK' | 'N/A';
export const STATUS_ALERTA_LABEL: Record<StatusAlerta, string> = {
  VENCIDO: 'Vencido',
  ALERTA: 'Alerta',
  OK: 'Em dia',
  'N/A': '—',
};
export const STATUS_ALERTA_TONE: Record<StatusAlerta, 'good' | 'warn' | 'bad' | 'default'> = {
  OK: 'good',
  ALERTA: 'warn',
  VENCIDO: 'bad',
  'N/A': 'default',
};

export type Papel = 'ADMIN' | 'EDITOR' | 'VISUALIZADOR';
export const PAPEL_LABEL: Record<Papel, string> = {
  ADMIN: 'Administrador',
  EDITOR: 'Pode editar',
  VISUALIZADOR: 'Somente visualizar',
};

export type StatusUsuario = 'PENDENTE' | 'APROVADO' | 'REJEITADO';
export const STATUS_USUARIO_LABEL: Record<StatusUsuario, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  REJEITADO: 'Bloqueado',
};
export const STATUS_USUARIO_TONE: Record<StatusUsuario, 'good' | 'warn' | 'bad'> = {
  APROVADO: 'good',
  PENDENTE: 'warn',
  REJEITADO: 'bad',
};

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: Papel;
  status: StatusUsuario;
  criadoEm: string;
}

export interface Embarcacao {
  id: number;
  nome: string;
  tipoConfiguracao: TipoConfiguracao;
  latitude: number | null;
  longitude: number | null;
  localizacaoAtualizadaEm: string | null;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface CaixaReversora {
  id: number;
  motorId: number;
  marca: string | null;
  modelo: string | null;
  ratio: string | null;
}

export interface SistemaEixoHelice {
  id: number;
  motorId: number;
  diametroHelice: string | null;
  passoHelice: string | null;
  numPas: number | null;
  diametroEixo: string | null;
  grauCone: string | null;
  comprimentoCone: string | null;
}

export interface Correia {
  id: number;
  motorId: number;
  funcaoAplicacao: string | null;
  especificacaoTamanho: string | null;
  quantidade: number;
}

export interface ManutencaoPreventiva {
  id: number;
  motorId: number;
  tipoServico: string;
  horimetroUltimaTroca: number;
  intervaloHoras: number;
  alertaLimiteHoras: number;
  proximaTroca: number;
  horasRestantes: number;
  status: StatusAlerta;
}

export interface ManutencaoCascoPintura {
  id: number;
  embarcacaoId: number;
  tipoIntervencao: TipoIntervencao;
  dataExecucao: string | null;
  horimetroEmbarcacao: number | null;
  esquemaProdutos: string | null;
  historicoObservacoes: string | null;
  alertaVencimentoData: string | null;
  diasRestantes: number | null;
  status: StatusAlerta;
}

export interface Motor {
  id: number;
  embarcacaoId: number;
  posicao: PosicaoMotor;
  marca: string | null;
  modelo: string | null;
  potenciaConfig: string | null;
  numSerie: string | null;
  horimetroAtual: number;
}

export interface MotorDetalhado extends Motor {
  caixaReversora: CaixaReversora | null;
  sistemaEixoHelice: SistemaEixoHelice | null;
  correias: Correia[];
  manutencoes: ManutencaoPreventiva[];
}

export interface EmbarcacaoDetalhada extends Embarcacao {
  motores: MotorDetalhado[];
  cascoPintura: ManutencaoCascoPintura[];
}

export interface ResumoAlertas {
  manutencaoVencida: number;
  manutencaoAlerta: number;
  cascoPinturaVencido: number;
  cascoPinturaAlerta: number;
}

export interface ManutencaoAlerta {
  embarcacaoId: number;
  embarcacaoNome: string;
  motorId: number;
  motorPosicao: PosicaoMotor;
  manutencaoId: number;
  tipoServico: string;
  proximaTroca: number;
  horasRestantes: number;
  status: StatusAlerta;
}

export interface CascoPinturaAlerta {
  embarcacaoId: number;
  embarcacaoNome: string;
  cascoPinturaId: number;
  tipoIntervencao: TipoIntervencao;
  diasRestantes: number | null;
  status: StatusAlerta;
}

export interface DashboardAlertas {
  resumo: ResumoAlertas;
  manutencoes: ManutencaoAlerta[];
  cascoPintura: CascoPinturaAlerta[];
}

export interface NotificationEvent {
  id: string;
  type: 'MANUTENCAO' | 'CASCO_PINTURA';
  important: boolean;
  title: string;
  description: string;
  link: { label: string; href: string };
  lida: boolean;
}

export interface NotificationSummary {
  total: number;
  naoLidas: number;
  importantes: number;
}

export interface ChecklistTemplateItem {
  categoria: string;
  descricao: string;
  ordem: number;
}

export interface AuditoriaItem {
  id?: number;
  categoria: string;
  descricao: string;
  concluido: boolean;
  observacao: string | null;
  ordem: number;
}

export interface AuditoriaResumo {
  id: number;
  responsavel: string;
  dataRealizacao: string;
  criadoEm: string;
  totalItens: number;
}

export interface Auditoria {
  id: number;
  embarcacaoId: number;
  responsavel: string;
  dataRealizacao: string;
  horimetro: number | null;
  observacoesGerais: string | null;
  criadoEm: string;
  itens: AuditoriaItem[];
  embarcacao: Embarcacao;
  criadoPor: { nome: string } | null;
}
