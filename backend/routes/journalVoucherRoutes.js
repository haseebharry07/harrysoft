const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/authMiddleware');
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
router.put('/:id', authorize('admin'), updateJournalVoucher);
router.delete('/:id', authorize('admin'), deleteJournalVoucher);

module.exports = router;
