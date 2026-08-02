const pool = require('../db/pool');
const HttpError = require('../utils/HttpError');
const { computeManutencaoStatus } = require('../utils/alertCalculators');

function annotate(row, horimetroAtual) {
  const { proximaTroca, horasRestantes, status } = computeManutencaoStatus(
    horimetroAtual,
    row.horimetro_ultima_troca,
    row.intervalo_horas,
    row.alerta_limite_horas
  );
  return { ...row, proximaTroca, horasRestantes, status };
}

async function listByMotorId(motorId) {
  const { rows: motorRows } = await pool.query('SELECT horimetro_atual FROM motor WHERE id = $1', [motorId]);
  if (!motorRows[0]) throw new HttpError(404, 'Motor não encontrado');
  const horimetroAtual = motorRows[0].horimetro_atual;

  const { rows } = await pool.query(
    'SELECT * FROM manutencao_preventiva WHERE motor_id = $1 ORDER BY id', [motorId]
  );
  return rows.map((row) => annotate(row, horimetroAtual));
}

async function create(motorId, { tipo_servico, horimetro_ultima_troca, intervalo_horas, alerta_limite_horas }) {
  if (!tipo_servico || !tipo_servico.trim()) throw new HttpError(400, 'tipo_servico é obrigatório');
  if (!intervalo_horas || Number(intervalo_horas) <= 0) {
    throw new HttpError(400, 'intervalo_horas deve ser maior que zero');
  }
  const { rows } = await pool.query(
    `INSERT INTO manutencao_preventiva (motor_id, tipo_servico, horimetro_ultima_troca, intervalo_horas, alerta_limite_horas)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [motorId, tipo_servico.trim(), horimetro_ultima_troca || 0, intervalo_horas, alerta_limite_horas || 0]
  );
  return rows[0];
}

async function update(id, { tipo_servico, horimetro_ultima_troca, intervalo_horas, alerta_limite_horas }) {
  if (!tipo_servico || !tipo_servico.trim()) throw new HttpError(400, 'tipo_servico é obrigatório');
  if (!intervalo_horas || Number(intervalo_horas) <= 0) {
    throw new HttpError(400, 'intervalo_horas deve ser maior que zero');
  }
  const { rows } = await pool.query(
    `UPDATE manutencao_preventiva
     SET tipo_servico = $1, horimetro_ultima_troca = $2, intervalo_horas = $3, alerta_limite_horas = $4, atualizado_em = now()
     WHERE id = $5 RETURNING *`,
    [tipo_servico.trim(), horimetro_ultima_troca || 0, intervalo_horas, alerta_limite_horas || 0, id]
  );
  if (!rows[0]) throw new HttpError(404, 'Manutenção não encontrada');
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM manutencao_preventiva WHERE id = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Manutenção não encontrada');
}

async function registrarServico(id, horimetroExplicito) {
  const { rows } = await pool.query('SELECT * FROM manutencao_preventiva WHERE id = $1', [id]);
  const manutencao = rows[0];
  if (!manutencao) throw new HttpError(404, 'Manutenção não encontrada');

  let novoHorimetro = horimetroExplicito;
  if (novoHorimetro === undefined || novoHorimetro === null) {
    const { rows: motorRows } = await pool.query('SELECT horimetro_atual FROM motor WHERE id = $1', [manutencao.motor_id]);
    novoHorimetro = motorRows[0].horimetro_atual;
  }

  const { rows: updated } = await pool.query(
    `UPDATE manutencao_preventiva SET horimetro_ultima_troca = $1, atualizado_em = now() WHERE id = $2 RETURNING *`,
    [novoHorimetro, id]
  );

  const { rows: motorRows2 } = await pool.query('SELECT horimetro_atual FROM motor WHERE id = $1', [manutencao.motor_id]);
  return annotate(updated[0], motorRows2[0].horimetro_atual);
}

module.exports = { listByMotorId, create, update, remove, registrarServico, annotate };
