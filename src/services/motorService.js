const pool = require('../db/pool');
const HttpError = require('../utils/HttpError');

async function getMotor(id) {
  const { rows } = await pool.query('SELECT * FROM motor WHERE id = $1', [id]);
  if (!rows[0]) throw new HttpError(404, 'Motor não encontrado');
  return rows[0];
}

async function listByEmbarcacaoId(embarcacaoId) {
  const { rows } = await pool.query(
    `SELECT * FROM motor WHERE embarcacao_id = $1
     ORDER BY CASE posicao WHEN 'MONO' THEN 0 WHEN 'BORE/BABOR' THEN 1 ELSE 2 END`,
    [embarcacaoId]
  );
  return rows;
}

async function updateMotor(id, { marca, modelo, potencia_config, num_serie }) {
  const { rows } = await pool.query(
    `UPDATE motor SET marca = $1, modelo = $2, potencia_config = $3, num_serie = $4, atualizado_em = now()
     WHERE id = $5 RETURNING *`,
    [marca || null, modelo || null, potencia_config || null, num_serie || null, id]
  );
  if (!rows[0]) throw new HttpError(404, 'Motor não encontrado');
  return rows[0];
}

async function updateHorimetro(id, horimetro_atual) {
  const valor = Number(horimetro_atual);
  if (Number.isNaN(valor) || valor < 0) {
    throw new HttpError(400, 'horimetro_atual deve ser um número não negativo');
  }

  const motor = await getMotor(id);
  if (valor < Number(motor.horimetro_atual)) {
    throw new HttpError(
      409,
      `O novo horímetro (${valor}) não pode ser menor que o valor atual (${motor.horimetro_atual})`
    );
  }

  const { rows } = await pool.query(
    'UPDATE motor SET horimetro_atual = $1, atualizado_em = now() WHERE id = $2 RETURNING *',
    [valor, id]
  );
  return rows[0];
}

module.exports = { getMotor, listByEmbarcacaoId, updateMotor, updateHorimetro };
