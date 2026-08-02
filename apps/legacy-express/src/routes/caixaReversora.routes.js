const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const caixaReversoraService = require('../services/caixaReversoraService');

const router = express.Router();

router.get('/motores/:motorId/caixa-reversora', asyncHandler(async (req, res) => {
  res.json(await caixaReversoraService.getByMotorId(req.params.motorId));
}));

router.put('/motores/:motorId/caixa-reversora', asyncHandler(async (req, res) => {
  res.json(await caixaReversoraService.upsert(req.params.motorId, req.body));
}));

module.exports = router;
