const express = require('express');
const { getAnnualReport } = require('../controllers/annualReportController');
const router = express.Router();
router.get('/', getAnnualReport);
module.exports = router;
