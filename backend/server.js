const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { protect } = require('./middleware/authMiddleware');

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/accounts', protect, require('./routes/accountRoutes'));
app.use('/api/transactions', protect, require('./routes/transactionRoutes'));
app.use('/api/invoices', protect, require('./routes/invoiceRoutes'));
app.use('/api/customers', protect, require('./routes/customerRoutes'));
app.use('/api/journal-vouchers', protect, require('./routes/journalVoucherRoutes'));
app.use('/api/cash-receipt-vouchers', protect, require('./routes/cashReceiptVoucherRoutes'));
app.use('/api/cash-payment-vouchers', protect, require('./routes/cashPaymentVoucherRoutes'))

const PORT = process.env.PORT || 5000;

// Only listen when running locally (e.g. `node server.js` or nodemon).
// On Vercel, the exported app is invoked as a serverless function instead.
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
