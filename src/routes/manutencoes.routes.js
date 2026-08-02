const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const manutencaoService = require('../services/manutencaoService');

const router = express.Router();

router.get('/motores/:motorId/manutencoes', asyncHandler(async (req, res) => {
  res.json(await manutencaoService.listByMotorId(req.params.motorId));
}));

router.post('/motores/:motorId/manutencoes', asyncHandler(async (req, res) => {
  const created = await manutencaoService.create(req.params.motorId, req.body);
  res.status(201).json(created);
}));

router.put('/manutencoes/:id', asyncHandler(async (req, res) => {
  res.json(await manutencaoService.update(req.params.id, req.body));
}));

router.delete('/manutencoes/:id', asyncHandler(async (req, res) => {
  await manutencaoService.remove(req.params.id);
  res.status(204).end();
}));

router.patch('/manutencoes/:id/registrar-servico', asyncHandler(async (req, res) => {
  res.json(await manutencaoService.registrarServico(req.params.id, req.body.horimetro));
}));

module.exports = router;
