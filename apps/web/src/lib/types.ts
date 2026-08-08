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

export type TipoManutencao = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA';
export const TIPO_MANUTENCAO_LABEL: Record<TipoManutencao, string> = {
  PREVENTIVA: 'Preventiva',
  PREDITIVA: 'Preditiva',
  CORRETIVA: 'Corretiva',
};
export const TIPO_MANUTENCAO_TONE: Record<TipoManutencao, 'good' | 'warn' | 'bad' | 'default'> = {
  PREVENTIVA: 'good',
  PREDITIVA: 'warn',
  CORRETIVA: 'bad',
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
  tipo: TipoManutencao;
  tipoServico: string;
  horimetroUltimaTroca: number;
  /** So preenchido para tipo PREVENTIVA. */
  intervaloHoras: number | null;
  alertaLimiteHoras: number;
  proximaTroca: number | null;
  horasRestantes: number | null;
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

// ---------------------------------------------------------------------------
// Histórico de execuções e relatório por período
// ---------------------------------------------------------------------------

export type PeriodoRelatorio = '3m' | '6m' | '12m' | '60m' | 'tudo';

export const PERIODO_RELATORIO_LABEL: Record<PeriodoRelatorio, string> = {
  '3m': '3 meses',
  '6m': '6 meses',
  '12m': 'Anual',
  '60m': 'Quinquenal',
  tudo: 'Tudo',
};

export interface ExecucaoManutencao {
  id: number;
  dataExecucao: string;
  horimetro: number | null;
  observacoes: string | null;
  origem: string;
  registradoPor: string | null;
  custo: number | null;
  fornecedor: string | null;
  despesaId?: number | null;
}

export interface ManutencaoRelatorio {
  id: number;
  tipo: TipoManutencao;
  tipoServico: string;
  intervaloHoras: number | null;
  alertaLimiteHoras: number;
  horimetroUltimaTroca: number | null;
  proximaTroca: number | null;
  horasRestantes: number | null;
  status: StatusAlerta;
  execucoes: ExecucaoManutencao[];
}

export interface MotorRelatorio {
  id: number;
  posicao: PosicaoMotor;
  posicaoLabel: string;
  marca: string | null;
  modelo: string | null;
  potenciaConfig: string | null;
  numSerie: string | null;
  horimetroAtual: number;
  caixaReversora: CaixaReversora | null;
  sistemaEixoHelice: SistemaEixoHelice | null;
  correias: Correia[];
  manutencoes: ManutencaoRelatorio[];
}

export interface AuditoriaRelatorio {
  id: number;
  responsavel: string;
  dataRealizacao: string;
  horimetro: number | null;
  observacoesGerais: string | null;
  itens: AuditoriaItem[];
  totalItens: number;
  itensConcluidos: number;
}

// ---------------------------------------------------------------------------
// Financeiro — Fase 1: nucleo (clientes, contratos, centros de custo,
// despesas, receitas)
// ---------------------------------------------------------------------------

export type StatusContrato = 'ATIVO' | 'ENCERRADO' | 'SUSPENSO';
export const STATUS_CONTRATO_LABEL: Record<StatusContrato, string> = {
  ATIVO: 'Ativo',
  ENCERRADO: 'Encerrado',
  SUSPENSO: 'Suspenso',
};
export const STATUS_CONTRATO_TONE: Record<StatusContrato, 'good' | 'warn' | 'bad' | 'default'> = {
  ATIVO: 'good',
  SUSPENSO: 'warn',
  ENCERRADO: 'default',
};

export type StatusReceita = 'RECEBIDO' | 'PENDENTE' | 'EM_ATRASO';
export const STATUS_RECEITA_LABEL: Record<StatusReceita, string> = {
  RECEBIDO: 'Recebido',
  PENDENTE: 'Pendente',
  EM_ATRASO: 'Em atraso',
};
export const STATUS_RECEITA_TONE: Record<StatusReceita, 'good' | 'warn' | 'bad'> = {
  RECEBIDO: 'good',
  PENDENTE: 'warn',
  EM_ATRASO: 'bad',
};

export type CategoriaDespesa =
  | 'COMBUSTIVEL'
  | 'LUBRIFICANTES'
  | 'OLEO'
  | 'PECAS'
  | 'OFICINA'
  | 'ESTALEIRO'
  | 'MOTOR'
  | 'GERADOR'
  | 'BOMBAS'
  | 'ELETRICA'
  | 'HIDRAULICA'
  | 'ALIMENTACAO'
  | 'HOSPEDAGEM'
  | 'SALARIOS'
  | 'IMPOSTOS'
  | 'SEGURO'
  | 'DOCUMENTACAO'
  | 'MATERIAL_CONSUMO'
  | 'FERRAMENTAS'
  | 'TERCEIROS'
  | 'FRETES'
  | 'OUTROS';

export const CATEGORIA_DESPESA_LABEL: Record<CategoriaDespesa, string> = {
  COMBUSTIVEL: 'Combustível',
  LUBRIFICANTES: 'Lubrificantes',
  OLEO: 'Óleo',
  PECAS: 'Peças',
  OFICINA: 'Oficina',
  ESTALEIRO: 'Estaleiro',
  MOTOR: 'Motor',
  GERADOR: 'Gerador',
  BOMBAS: 'Bombas',
  ELETRICA: 'Elétrica',
  HIDRAULICA: 'Hidráulica',
  ALIMENTACAO: 'Alimentação',
  HOSPEDAGEM: 'Hospedagem',
  SALARIOS: 'Salários',
  IMPOSTOS: 'Impostos',
  SEGURO: 'Seguro',
  DOCUMENTACAO: 'Documentação',
  MATERIAL_CONSUMO: 'Material de Consumo',
  FERRAMENTAS: 'Ferramentas',
  TERCEIROS: 'Terceiros',
  FRETES: 'Fretes',
  OUTROS: 'Outros',
};

export interface Cliente {
  id: number;
  nome: string;
  documento: string | null;
  contatoNome: string | null;
  contatoEmail: string | null;
  contatoTelefone: string | null;
  observacoes: string | null;
  criadoEm: string;
}

export interface Contrato {
  id: number;
  clienteId: number;
  numero: string | null;
  descricao: string | null;
  valor: number | null;
  dataInicio: string | null;
  dataFim: string | null;
  status: StatusContrato;
  observacoes: string | null;
  criadoEm: string;
  cliente?: Cliente;
}

export interface CentroCusto {
  id: number;
  nome: string;
  paiId: number | null;
}

export interface Despesa {
  id: number;
  categoria: CategoriaDespesa;
  subcategoria: string | null;
  embarcacaoId: number | null;
  centroCustoId: number | null;
  fornecedor: string | null;
  numeroNotaFiscal: string | null;
  valor: number;
  data: string;
  formaPagamento: string | null;
  observacoes: string | null;
  criadoEm: string;
  embarcacao?: Embarcacao | null;
  centroCusto?: CentroCusto | null;
}

export interface Receita {
  id: number;
  clienteId: number;
  contratoId: number | null;
  embarcacaoId: number | null;
  tipoServico: string | null;
  valorContratado: number | null;
  valorFaturado: number | null;
  valorRecebido: number | null;
  data: string;
  status: StatusReceita;
  observacoes: string | null;
  criadoEm: string;
  cliente?: Cliente;
  contrato?: Contrato | null;
  embarcacao?: Embarcacao | null;
}

export interface RelatorioEmbarcacao {
  geradoEm: string;
  periodo: { chave: PeriodoRelatorio; label: string; inicio: string | null; fim: string };
  embarcacao: {
    id: number;
    nome: string;
    tipoConfiguracao: TipoConfiguracao;
    latitude: number | null;
    longitude: number | null;
    localizacaoAtualizadaEm: string | null;
  };
  resumo: {
    totalMotores: number;
    totalPlanos: number;
    manutencoesVencidas: number;
    manutencoesEmAlerta: number;
    servicosExecutadosNoPeriodo: number;
    intervencoesCascoPintura: number;
    auditoriasRealizadas: number;
  };
  motores: MotorRelatorio[];
  cascoPintura: ManutencaoCascoPintura[];
  auditorias: AuditoriaRelatorio[];
}
