const mongoose = require('mongoose');

// Generic auto-increment counter. One document per sequence name (e.g. "journalVoucher").
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);