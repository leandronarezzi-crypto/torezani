const pool = require('../db/pool');

async function getByMotorId(motorId) {
  const { rows } = await pool.query('SELECT * FROM caixa_reversora WHERE motor_id = $1', [motorId]);
  return rows[0] || null;
}

async function upsert(motorId, { marca, modelo, ratio }) {
  const { rows } = await pool.query(
    `INSERT INTO caixa_reversora (motor_id, marca, modelo, ratio)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (motor_id) DO UPDATE
       SET marca = EXCLUDED.marca, modelo = EXCLUDED.modelo, ratio = EXCLUDED.ratio, atualizado_em = now()
     RETURNING *`,
    [motorId, marca || null, modelo || null, ratio || null]
  );
  return rows[0];
}

module.exports = { getByMotorId, upsert };
