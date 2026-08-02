const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const { authGuard, setAuthCookie, clearAuthCookie } = require('../middleware/auth');

const router = express.Router();

router.post('/registrar', asyncHandler(async (req, res) => {
  const usuario = await authService.registrar(req.body);
  res.status(201).json(usuario);
}));

router.post('/login', asyncHandler(async (req, res) => {
  const usuario = await authService.autenticar(req.body);
  setAuthCookie(res, usuario);
  res.json(usuario);
}));

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get('/me', authGuard, (req, res) => {
  res.json(req.user);
});

module.exports = router;
