const pool = require('../db/pool');
const HttpError = require('../utils/HttpError');
const { computeCascoPinturaStatus } = require('../utils/alertCalculators');

const TIPOS_VALIDOS = ['CASCO', 'PINTURA'];

function annotate(row) {
  const { diasRestantes, status } = computeCascoPinturaStatus(row.alerta_vencimento_data);
  return { ...row, diasRestantes, status };
}

async function listByEmbarcacaoId(embarcacaoId) {
  const { rows } = await pool.query(
    'SELECT * FROM manutencao_casco_pintura WHERE embarcacao_id = $1 ORDER BY data_execucao DESC NULLS LAST, id DESC',
    [embarcacaoId]
  );
  return rows.map(annotate);
}

async function create(embarcacaoId, { tipo_intervencao, data_execucao, horimetro_embarcacao, esquema_produtos, historico_observacoes, alerta_vencimento_data }) {
  if (!TIPOS_VALIDOS.includes(tipo_intervencao)) {
    throw new HttpError(400, 'tipo_intervencao deve ser CASCO ou PINTURA');
  }
  const { rows } = await pool.query(
    `INSERT INTO manutencao_casco_pintura
       (embarcacao_id, tipo_intervencao, data_execucao, horimetro_embarcacao, esquema_produtos, historico_observacoes, alerta_vencimento_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      embarcacaoId,
      tipo_intervencao,
      data_execucao || null,
      horimetro_embarcacao || null,
      esquema_produtos || null,
      historico_observacoes || null,
      alerta_vencimento_data || null,
    ]
  );
  return annotate(rows[0]);
}

async function update(id, { tipo_intervencao, data_execucao, horimetro_embarcacao, esquema_produtos, historico_observacoes, alerta_vencimento_data }) {
  if (!TIPOS_VALIDOS.includes(tipo_intervencao)) {
    throw new HttpError(400, 'tipo_intervencao deve ser CASCO ou PINTURA');
  }
  const { rows } = await pool.query(
    `UPDATE manutencao_casco_pintura
     SET tipo_intervencao = $1, data_execucao = $2, horimetro_embarcacao = $3, esquema_produtos = $4,
         historico_observacoes = $5, alerta_vencimento_data = $6, atualizado_em = now()
     WHERE id = $7 RETURNING *`,
    [
      tipo_intervencao,
      data_execucao || null,
      horimetro_embarcacao || null,
      esquema_produtos || null,
      historico_observacoes || null,
      alerta_vencimento_data || null,
      id,
    ]
  );
  if (!rows[0]) throw new HttpError(404, 'Registro de casco/pintura não encontrado');
  return annotate(rows[0]);
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM manutencao_casco_pintura WHERE id = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Registro de casco/pintura não encontrado');
}

module.exports = { listByEmbarcacaoId, create, update, remove, annotate };
