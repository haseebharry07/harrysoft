const express = require('express');
const { getTrialBalance } = require('../controllers/trialBalanceController');

const router = express.Router();
router.get('/', getTrialBalance);
module.exports = router;
