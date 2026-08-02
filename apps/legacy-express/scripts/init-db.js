require('dotenv').config();
const { ensureSchema } = require('../src/db/init');
const pool = require('../src/db/pool');

ensureSchema()
  .then(() => {
    console.log('Schema aplicado com sucesso.');
    return pool.end();
  })
  .catch((err) => {
    console.error('Falha ao aplicar o schema:', err.message);
    process.exit(1);
  });
