const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  type: { type: String, enum: ['Customer', 'Vendor'], default: 'Customer' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);