const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const embarcacoesRoutes = require('./routes/embarcacoes.routes');
const motoresRoutes = require('./routes/motores.routes');
const caixaReversoraRoutes = require('./routes/caixaReversora.routes');
const eixoHeliceRoutes = require('./routes/eixoHelice.routes');
const correiasRoutes = require('./routes/correias.routes');
const manutencoesRoutes = require('./routes/manutencoes.routes');
const cascoPinturaRoutes = require('./routes/cascoPintura.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const healthRoutes = require('./routes/health.routes');
const { authGuard, writeGuard, requireAdmin } = require('./middleware/auth');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', authGuard, requireAdmin, adminRoutes);

app.use('/api', authGuard, writeGuard);
app.use('/api', embarcacoesRoutes);
app.use('/api', motoresRoutes);
app.use('/api', caixaReversoraRoutes);
app.use('/api', eixoHeliceRoutes);
app.use('/api', correiasRoutes);
app.use('/api', manutencoesRoutes);
app.use('/api', cascoPinturaRoutes);
app.use('/api', dashboardRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message || 'Erro interno do servidor' });
});

module.exports = app;
