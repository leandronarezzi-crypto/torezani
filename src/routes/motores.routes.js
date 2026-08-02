const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const motorService = require('../services/motorService');

const router = express.Router();

router.put('/motores/:id', asyncHandler(async (req, res) => {
  res.json(await motorService.updateMotor(req.params.id, req.body));
}));

router.patch('/motores/:id/horimetro', asyncHandler(async (req, res) => {
  res.json(await motorService.updateHorimetro(req.params.id, req.body.horimetro_atual));
}));

module.exports = router;
