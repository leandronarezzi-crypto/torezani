const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function ensureSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
}

module.exports = { ensureSchema };
