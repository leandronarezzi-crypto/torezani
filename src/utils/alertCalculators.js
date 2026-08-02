const DIAS_ALERTA_CASCO_PINTURA = 45;

function computeManutencaoStatus(horimetroAtual, horimetroUltimaTroca, intervaloHoras, alertaLimiteHoras) {
  const proximaTroca = Number(horimetroUltimaTroca) + Number(intervaloHoras);
  const horasRestantes = proximaTroca - Number(horimetroAtual);
  const status = horasRestantes <= 0 ? 'VENCIDO' : horasRestantes <= Number(alertaLimiteHoras) ? 'ALERTA' : 'OK';
  return { proximaTroca, horasRestantes, status };
}

function computeCascoPinturaStatus(alertaVencimentoData, hoje = new Date()) {
  if (!alertaVencimentoData) return { diasRestantes: null, status: 'N/A' };
  const diasRestantes = Math.floor((new Date(alertaVencimentoData) - hoje) / 86400000);
  const status = diasRestantes <= 0 ? 'VENCIDO' : diasRestantes <= DIAS_ALERTA_CASCO_PINTURA ? 'ALERTA' : 'OK';
  return { diasRestantes, status };
}

module.exports = { computeManutencaoStatus, computeCascoPinturaStatus, DIAS_ALERTA_CASCO_PINTURA };
