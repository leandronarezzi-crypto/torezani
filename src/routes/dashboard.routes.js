const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');

const router = express.Router();

router.get('/dashboard/alertas', asyncHandler(async (req, res) => {
  res.json(await dashboardService.getAlertas());
}));

module.exports = router;
