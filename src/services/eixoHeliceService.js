const pool = require('../db/pool');

async function getByMotorId(motorId) {
  const { rows } = await pool.query('SELECT * FROM sistema_eixo_helice WHERE motor_id = $1', [motorId]);
  return rows[0] || null;
}

async function upsert(motorId, { diametro_helice, passo_helice, num_pas, diametro_eixo, grau_cone, comprimento_cone }) {
  const { rows } = await pool.query(
    `INSERT INTO sistema_eixo_helice
       (motor_id, diametro_helice, passo_helice, num_pas, diametro_eixo, grau_cone, comprimento_cone)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (motor_id) DO UPDATE
       SET diametro_helice = EXCLUDED.diametro_helice,
           passo_helice = EXCLUDED.passo_helice,
           num_pas = EXCLUDED.num_pas,
           diametro_eixo = EXCLUDED.diametro_eixo,
           grau_cone = EXCLUDED.grau_cone,
           comprimento_cone = EXCLUDED.comprimento_cone,
           atualizado_em = now()
     RETURNING *`,
    [
      motorId,
      diametro_helice || null,
      passo_helice || null,
      num_pas || null,
      diametro_eixo || null,
      grau_cone || null,
      comprimento_cone || null,
    ]
  );
  return rows[0];
}

module.exports = { getByMotorId, upsert };
