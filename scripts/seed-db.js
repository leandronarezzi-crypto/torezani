require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

const seedPath = path.join(__dirname, '..', 'src', 'db', 'seed.sql');
const seedSql = fs.readFileSync(seedPath, 'utf8');

pool
  .query(seedSql)
  .then(() => {
    console.log('Dados de exemplo inseridos com sucesso.');
    return pool.end();
  })
  .catch((err) => {
    console.error('Falha ao inserir dados de exemplo:', err.message);
    process.exit(1);
  });
