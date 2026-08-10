const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  reference: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);