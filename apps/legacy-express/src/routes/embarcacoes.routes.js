const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const embarcacaoService = require('../services/embarcacaoService');
const detailService = require('../services/detailService');

const router = express.Router();

router.get('/embarcacoes', asyncHandler(async (req, res) => {
  res.json(await embarcacaoService.listEmbarcacoes());
}));

router.post('/embarcacoes', asyncHandler(async (req, res) => {
  const created = await embarcacaoService.createEmbarcacao(req.body);
  res.status(201).json(created);
}));

router.get('/embarcacoes/:id/detail', asyncHandler(async (req, res) => {
  res.json(await detailService.getEmbarcacaoDetail(req.params.id));
}));

router.get('/embarcacoes/:id', asyncHandler(async (req, res) => {
  res.json(await embarcacaoService.getEmbarcacao(req.params.id));
}));

router.put('/embarcacoes/:id', asyncHandler(async (req, res) => {
  res.json(await embarcacaoService.updateEmbarcacao(req.params.id, req.body));
}));

router.patch('/embarcacoes/:id/localizacao', asyncHandler(async (req, res) => {
  res.json(await embarcacaoService.updateLocalizacao(req.params.id, req.body));
}));

router.delete('/embarcacoes/:id', asyncHandler(async (req, res) => {
  await embarcacaoService.deleteEmbarcacao(req.params.id);
  res.status(204).end();
}));

module.exports = router;
