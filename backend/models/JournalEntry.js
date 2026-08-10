const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 }
});

const JournalVoucherFormSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  memo: String,
  lines: [lineSchema]
}, { timestamps: true });

module.exports = mongoose.model('JournalVoucherForm', JournalVoucherFormSchema);