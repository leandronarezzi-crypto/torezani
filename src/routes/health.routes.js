const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const pool = require('../db/pool');

const router = express.Router();

router.get('/health', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));

module.exports = router;
