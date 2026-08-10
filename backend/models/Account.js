const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountName: { type: String, required: true },
  accountCode: { type: String, required: true, unique: true },
  bfDr: { type: Number, default: 0 },
  bfCr: { type: Number, default: 0 },
  headGroup: {
    type: String,
    enum: ['Expense', 'Income', 'Sales', 'Purchase','Debtors', 'Creditors', 'Bank', 'Cash', 'Fixed Assets', 'Current Assets', 'Current Liabilities', 'Capital'],
    // not required — account can be created without a Head Group
  },
  expenseGroup: {
    type: String,
    enum: [
      'Main Expenses',
  'Running Expenses',
  'Other Expenses'
    ]
    // not required — only relevant when headGroup is 'Expense'
  },
  bfDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);