const express = require('express');
const router = express.Router();
const {
  createJournalVoucher,
  getJournalVouchers,
  getJournalVoucherById,
  updateJournalVoucher,
  deleteJournalVoucher,
  previewNextVoucherNo
} = require('../controllers/journalVoucherController');

// IMPORTANT: this specific route must be registered before '/:id'
router.get('/next-voucher-no', previewNextVoucherNo);

router.post('/', createJournalVoucher);
router.get('/', getJournalVouchers);
router.get('/:id', getJournalVoucherById);
router.put('/:id', updateJournalVoucher);
router.delete('/:id', deleteJournalVoucher);

module.exports = router;