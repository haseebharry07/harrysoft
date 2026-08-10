const express = require('express');
const router = express.Router();
const {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount
} = require('../controllers/accountController');

router.post('/', createAccount);
router.get('/', getAccounts);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

module.exports = router;