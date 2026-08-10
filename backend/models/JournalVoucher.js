const mongoose = require('mongoose');

// One DR or CR line against an Account Head within a voucher.
const entrySchema = new mongoose.Schema(
  {
    accountHead: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    drAmount: { type: Number, default: 0, min: 0 },
    crAmount: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const journalVoucherSchema = new mongoose.Schema(
  {
    voucherNo: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    narration: { type: String, default: '' },
    purchaseQty: { type: Number, default: 0, min: 0 },
    saleQty: { type: Number, default: 0, min: 0 },
    // Snapshot of the Cash in Hand balance at the time this voucher was created (display/reference only).
    cashInHand: { type: Number, default: 0 },
    entries: {
      type: [entrySchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A journal voucher needs at least one Account Head line.'
      }
    },
    totalDr: { type: Number, required: true },
    totalCr: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('JournalVoucher', journalVoucherSchema);