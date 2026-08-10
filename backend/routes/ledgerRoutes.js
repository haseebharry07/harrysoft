const express = require('express');
const { getLedger } = require('../controllers/ledgerController');

const router = express.Router();
router.get('/', getLedger);

module.exports = router;
