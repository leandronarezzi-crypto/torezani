const pool = require('../db/pool');
const HttpError = require('../utils/HttpError');

async function listByMotorId(motorId) {
  const { rows } = await pool.query(
    'SELECT * FROM correia WHERE motor_id = $1 ORDER BY id', [motorId]
  );
  return rows;
}

async function create(motorId, { funcao_aplicacao, especificacao_tamanho, quantidade }) {
  const { rows } = await pool.query(
    `INSERT INTO correia (motor_id, funcao_aplicacao, especificacao_tamanho, quantidade)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [motorId, funcao_aplicacao || null, especificacao_tamanho || null, quantidade || 1]
  );
  return rows[0];
}

async function update(id, { funcao_aplicacao, especificacao_tamanho, quantidade }) {
  const { rows } = await pool.query(
    `UPDATE correia SET funcao_aplicacao = $1, especificacao_tamanho = $2, quantidade = $3, atualizado_em = now()
     WHERE id = $4 RETURNING *`,
    [funcao_aplicacao || null, especificacao_tamanho || null, quantidade || 1, id]
  );
  if (!rows[0]) throw new HttpError(404, 'Correia não encontrada');
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM correia WHERE id = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Correia não encontrada');
}

module.exports = { listByMotorId, create, update, remove };
