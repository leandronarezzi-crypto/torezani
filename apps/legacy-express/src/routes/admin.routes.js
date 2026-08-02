const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const router = express.Router();

router.get('/usuarios', asyncHandler(async (req, res) => {
  res.json(await authService.listUsuarios());
}));

router.patch('/usuarios/:id', asyncHandler(async (req, res) => {
  res.json(await authService.atualizarUsuario(req.params.id, req.body));
}));

module.exports = router;
