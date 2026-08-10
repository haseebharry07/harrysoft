const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  unitPrice: Number,
  total: Number
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [invoiceItemSchema],
  subtotal: Number,
  tax: Number,
  total: Number,
  status: { type: String, enum: ['Draft', 'Sent', 'Paid', 'Overdue'], default: 'Draft' },
  dueDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);