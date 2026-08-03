export const DIAS_ALERTA_CASCO_PINTURA = 45;

export type StatusAlerta = 'VENCIDO' | 'ALERTA' | 'OK' | 'N/A';

export interface ManutencaoStatus {
  proximaTroca: number;
  horasRestantes: number;
  status: StatusAlerta;
}

export function computeManutencaoStatus(
  horimetroAtual: number,
  horimetroUltimaTroca: number,
  intervaloHoras: number,
  alertaLimiteHoras: number,
): ManutencaoStatus {
  const proximaTroca = Number(horimetroUltimaTroca) + Number(intervaloHoras);
  const horasRestantes = proximaTroca - Number(horimetroAtual);
  const status: StatusAlerta = horasRestantes <= 0 ? 'VENCIDO' : horasRestantes <= Number(alertaLimiteHoras) ? 'ALERTA' : 'OK';
  return { proximaTroca, horasRestantes, status };
}

export interface CascoPinturaStatus {
  diasRestantes: number | null;
  status: StatusAlerta;
}

export function computeCascoPinturaStatus(alertaVencimentoData: Date | string | null, hoje = new Date()): CascoPinturaStatus {
  if (!alertaVencimentoData) return { diasRestantes: null, status: 'N/A' };
  const diasRestantes = Math.floor((new Date(alertaVencimentoData).getTime() - hoje.getTime()) / 86400000);
  const status: StatusAlerta = diasRestantes <= 0 ? 'VENCIDO' : diasRestantes <= DIAS_ALERTA_CASCO_PINTURA ? 'ALERTA' : 'OK';
  return { diasRestantes, status };
}
