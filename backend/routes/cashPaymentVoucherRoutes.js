const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/authMiddleware');
const {
  createCashPaymentVoucher,
  getCashPaymentVouchers,
  getCashPaymentVoucherById,
  updateCashPaymentVoucher,
  deleteCashPaymentVoucher,
  previewNextVoucherNo
} = require('../controllers/CashPaymentVoucherController');

// IMPORTANT: this specific route must be registered before '/:id'
router.get('/next-voucher-no', previewNextVoucherNo);

router.post('/', createCashPaymentVoucher);
router.get('/', getCashPaymentVouchers);
router.get('/:id', getCashPaymentVoucherById);
router.put('/:id', authorize('admin'), updateCashPaymentVoucher);
router.delete('/:id', authorize('admin'), deleteCashPaymentVoucher);

module.exports = router;
