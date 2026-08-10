const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/authMiddleware');
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
router.put('/:id', authorize('admin'), updateCashReceiptVoucher);
router.delete('/:id', authorize('admin'), deleteCashReceiptVoucher);

module.exports = router;
