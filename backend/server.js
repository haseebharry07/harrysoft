const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/accounts', require('./routes/accountRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/journal-vouchers', require('./routes/journalVoucherRoutes'));
app.use('/api/cash-receipt-vouchers', require('./routes/cashReceiptVoucherRoutes'));
app.use('/api/cash-payment-vouchers', require('./routes/cashPaymentVoucherRoutes'))

const PORT = process.env.PORT || 5000;

// Only listen when running locally (e.g. `node server.js` or nodemon).
// On Vercel, the exported app is invoked as a serverless function instead.
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;