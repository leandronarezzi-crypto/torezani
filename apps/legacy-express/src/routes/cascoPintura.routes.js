const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const cascoPinturaService = require('../services/cascoPinturaService');

const router = express.Router();

router.get('/embarcacoes/:embarcacaoId/casco-pintura', asyncHandler(async (req, res) => {
  res.json(await cascoPinturaService.listByEmbarcacaoId(req.params.embarcacaoId));
}));

router.post('/embarcacoes/:embarcacaoId/casco-pintura', asyncHandler(async (req, res) => {
  const created = await cascoPinturaService.create(req.params.embarcacaoId, req.body);
  res.status(201).json(created);
}));

router.put('/casco-pintura/:id', asyncHandler(async (req, res) => {
  res.json(await cascoPinturaService.update(req.params.id, req.body));
}));

router.delete('/casco-pintura/:id', asyncHandler(async (req, res) => {
  await cascoPinturaService.remove(req.params.id);
  res.status(204).end();
}));

module.exports = router;
