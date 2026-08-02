require('dotenv').config();

const app = require('./src/app');
const { ensureSchema } = require('./src/db/init');

const PORT = process.env.PORT || 3000;

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Postgres não respondeu — verifique se está rodando e se DATABASE_URL em .env está correto.');
    console.error(err.message);
    process.exit(1);
  });
