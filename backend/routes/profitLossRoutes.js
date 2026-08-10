const express = require('express');
const { getProfitLoss } = require('../controllers/profitLossController');
const router = express.Router();
router.get('/', getProfitLoss);
module.exports = router;
