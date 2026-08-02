const pool = require('../db/pool');
const { computeManutencaoStatus, computeCascoPinturaStatus } = require('../utils/alertCalculators');

async function getAlertas() {
  const { rows: manutencaoRows } = await pool.query(`
    SELECT
      e.id AS embarcacao_id, e.nome AS embarcacao_nome,
      m.id AS motor_id, m.posicao AS motor_posicao, m.horimetro_atual,
      mp.id AS manutencao_id, mp.tipo_servico, mp.horimetro_ultima_troca, mp.intervalo_horas, mp.alerta_limite_horas
    FROM manutencao_preventiva mp
    JOIN motor m ON m.id = mp.motor_id
    JOIN embarcacao e ON e.id = m.embarcacao_id
  `);

  const manutencoes = manutencaoRows
    .map((row) => {
      const { proximaTroca, horasRestantes, status } = computeManutencaoStatus(
        row.horimetro_atual, row.horimetro_ultima_troca, row.intervalo_horas, row.alerta_limite_horas
      );
      return {
        embarcacaoId: row.embarcacao_id,
        embarcacaoNome: row.embarcacao_nome,
        motorId: row.motor_id,
        motorPosicao: row.motor_posicao,
        manutencaoId: row.manutencao_id,
        tipoServico: row.tipo_servico,
        proximaTroca,
        horasRestantes,
        status,
      };
    })
    .filter((item) => item.status !== 'OK')
    .sort((a, b) => a.horasRestantes - b.horasRestantes);

  const { rows: cascoPinturaRows } = await pool.query(`
    SELECT
      e.id AS embarcacao_id, e.nome AS embarcacao_nome,
      cp.id AS casco_pintura_id, cp.tipo_intervencao, cp.alerta_vencimento_data
    FROM manutencao_casco_pintura cp
    JOIN embarcacao e ON e.id = cp.embarcacao_id
    WHERE cp.alerta_vencimento_data IS NOT NULL
  `);

  const cascoPintura = cascoPinturaRows
    .map((row) => {
      const { diasRestantes, status } = computeCascoPinturaStatus(row.alerta_vencimento_data);
      return {
        embarcacaoId: row.embarcacao_id,
        embarcacaoNome: row.embarcacao_nome,
        cascoPinturaId: row.casco_pintura_id,
        tipoIntervencao: row.tipo_intervencao,
        diasRestantes,
        status,
      };
    })
    .filter((item) => item.status !== 'OK')
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  const resumo = {
    manutencaoVencida: manutencoes.filter((m) => m.status === 'VENCIDO').length,
    manutencaoAlerta: manutencoes.filter((m) => m.status === 'ALERTA').length,
    cascoPinturaVencido: cascoPintura.filter((c) => c.status === 'VENCIDO').length,
    cascoPinturaAlerta: cascoPintura.filter((c) => c.status === 'ALERTA').length,
  };

  return { resumo, manutencoes, cascoPintura };
}

module.exports = { getAlertas };
