const express = require('express');
const router = express.Router();
const {
  createCashPaymentVoucher,
  getCashPaymentVouchers,
  getCashPaymentVoucherById,
  updateCashPaymentVoucher,
  deleteCashPaymentVoucher,
  previewNextVoucherNo
} = require('../controllers/cashPaymentVoucherController');

// IMPORTANT: this specific route must be registered before '/:id'
router.get('/next-voucher-no', previewNextVoucherNo);

router.post('/', createCashPaymentVoucher);
router.get('/', getCashPaymentVouchers);
router.get('/:id', getCashPaymentVoucherById);
router.put('/:id', updateCashPaymentVoucher);
router.delete('/:id', deleteCashPaymentVoucher);

module.exports = router;