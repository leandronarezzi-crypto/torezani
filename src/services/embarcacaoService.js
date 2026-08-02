const pool = require('../db/pool');
const HttpError = require('../utils/HttpError');

const TIPOS_VALIDOS = ['MONOMOTOR', 'BIMOTOR'];

async function listEmbarcacoes() {
  const { rows } = await pool.query(
    'SELECT id, nome, tipo_configuracao, latitude, longitude, localizacao_atualizada_em, criado_em FROM embarcacao ORDER BY nome'
  );
  return rows;
}

async function getEmbarcacao(id) {
  const { rows } = await pool.query('SELECT * FROM embarcacao WHERE id = $1', [id]);
  if (!rows[0]) throw new HttpError(404, 'Embarcação não encontrada');
  return rows[0];
}

async function createEmbarcacao({ nome, tipo_configuracao }) {
  if (!nome || !nome.trim()) throw new HttpError(400, 'Nome é obrigatório');
  if (!TIPOS_VALIDOS.includes(tipo_configuracao)) {
    throw new HttpError(400, 'tipo_configuracao deve ser MONOMOTOR ou BIMOTOR');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [vessel] } = await client.query(
      'INSERT INTO embarcacao (nome, tipo_configuracao) VALUES ($1, $2) RETURNING *',
      [nome.trim(), tipo_configuracao]
    );
    const posicoes = tipo_configuracao === 'BIMOTOR' ? ['BORE/BABOR', 'ESTIBORDO'] : ['MONO'];
    for (const posicao of posicoes) {
      await client.query('INSERT INTO motor (embarcacao_id, posicao) VALUES ($1, $2)', [vessel.id, posicao]);
    }
    await client.query('COMMIT');
    return vessel;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateEmbarcacao(id, { nome }) {
  if (!nome || !nome.trim()) throw new HttpError(400, 'Nome é obrigatório');
  const { rows } = await pool.query(
    'UPDATE embarcacao SET nome = $1, atualizado_em = now() WHERE id = $2 RETURNING *',
    [nome.trim(), id]
  );
  if (!rows[0]) throw new HttpError(404, 'Embarcação não encontrada');
  return rows[0];
}

async function deleteEmbarcacao(id) {
  const { rowCount } = await pool.query('DELETE FROM embarcacao WHERE id = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Embarcação não encontrada');
}

async function updateLocalizacao(id, { latitude, longitude }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new HttpError(400, 'Latitude inválida (deve estar entre -90 e 90)');
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new HttpError(400, 'Longitude inválida (deve estar entre -180 e 180)');
  }

  const { rows } = await pool.query(
    `UPDATE embarcacao SET latitude = $1, longitude = $2, localizacao_atualizada_em = now(), atualizado_em = now()
     WHERE id = $3 RETURNING id, nome, tipo_configuracao, latitude, longitude, localizacao_atualizada_em`,
    [lat, lng, id]
  );
  if (!rows[0]) throw new HttpError(404, 'Embarcação não encontrada');
  return rows[0];
}

module.exports = { listEmbarcacoes, getEmbarcacao, createEmbarcacao, updateEmbarcacao, deleteEmbarcacao, updateLocalizacao };
