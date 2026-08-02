const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const correiaService = require('../services/correiaService');

const router = express.Router();

router.get('/motores/:motorId/correias', asyncHandler(async (req, res) => {
  res.json(await correiaService.listByMotorId(req.params.motorId));
}));

router.post('/motores/:motorId/correias', asyncHandler(async (req, res) => {
  const created = await correiaService.create(req.params.motorId, req.body);
  res.status(201).json(created);
}));

router.put('/correias/:id', asyncHandler(async (req, res) => {
  res.json(await correiaService.update(req.params.id, req.body));
}));

router.delete('/correias/:id', asyncHandler(async (req, res) => {
  await correiaService.remove(req.params.id);
  res.status(204).end();
}));

module.exports = router;
