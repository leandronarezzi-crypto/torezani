const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const eixoHeliceService = require('../services/eixoHeliceService');

const router = express.Router();

router.get('/motores/:motorId/sistema-eixo-helice', asyncHandler(async (req, res) => {
  res.json(await eixoHeliceService.getByMotorId(req.params.motorId));
}));

router.put('/motores/:motorId/sistema-eixo-helice', asyncHandler(async (req, res) => {
  res.json(await eixoHeliceService.upsert(req.params.motorId, req.body));
}));

module.exports = router;
