const express = require('express');
const router = express.Router();
const {
  createCashReceiptVoucher,
  getCashReceiptVouchers,
  getCashReceiptVoucherById,
  updateCashReceiptVoucher,
  deleteCashReceiptVoucher,
  previewNextVoucherNo
} = require('../controllers/cashReceiptVoucherController');

// IMPORTANT: this specific route must be registered before '/:id'
router.get('/next-voucher-no', previewNextVoucherNo);

router.post('/', createCashReceiptVoucher);
router.get('/', getCashReceiptVouchers);
router.get('/:id', getCashReceiptVoucherById);
router.put('/:id', updateCashReceiptVoucher);
router.delete('/:id', deleteCashReceiptVoucher);

module.exports = router;