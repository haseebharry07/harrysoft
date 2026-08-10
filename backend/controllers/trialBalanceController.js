const Account = require('../models/Account');
const JournalVoucher = require('../models/JournalVoucher');
const CashReceiptVoucher = require('../models/CashReceiptVoucher');
const CashPaymentVoucher = require('../models/CashPaymentVoucher');

const amount = (value) => Number(value) || 0;

function rangeFilter(fromDate, toDate) {
  const filter = {};
  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = new Date(fromDate);
    if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); filter.date.$lte = end; }
  }
  return filter;
}

function distribute(total, lines, field, rows) {
  const eligible = lines.filter((line) => amount(line[field]) > 0);
  const denominator = eligible.reduce((sum, line) => sum + amount(line[field]), 0);
  if (!total || !denominator) return;
  eligible.forEach((line) => { rows.get(String(line.accountHead))[field === 'drAmount' ? 'purchase' : 'sale'] += total * amount(line[field]) / denominator; });
}

// @desc Standard trial balance with purchase and sale allocations
// @route GET /api/trial-balance?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
exports.getTrialBalance = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    if ((fromDate && !toDate) || (!fromDate && toDate)) return res.status(400).json({ message: 'Select both From Date and To Date, or leave both blank.' });
    if (fromDate && new Date(fromDate) > new Date(toDate)) return res.status(400).json({ message: 'From Date cannot be after To Date.' });

    const [accounts, journalVouchers, receiptVouchers, paymentVouchers] = await Promise.all([
      Account.find().sort({ accountCode: 1 }).lean(),
      JournalVoucher.find(rangeFilter(fromDate, toDate)).lean(),
      CashReceiptVoucher.find(rangeFilter(fromDate, toDate)).lean(),
      CashPaymentVoucher.find(rangeFilter(fromDate, toDate)).lean()
    ]);
    const rows = new Map(accounts.map((account) => [String(account._id), {
      accountId: String(account._id), accountCode: account.accountCode, accountName: account.accountName,
      debit: amount(account.bfDr), credit: amount(account.bfCr), purchase: 0, sale: 0
    }]));
    const allVouchers = [...journalVouchers, ...receiptVouchers, ...paymentVouchers];
    allVouchers.forEach((voucher) => {
      (voucher.entries || []).forEach((line) => {
        const row = rows.get(String(line.accountHead));
        if (!row) return;
        row.debit += amount(line.drAmount);
        row.credit += amount(line.crAmount);
      });
      // Purchase is allocated across debit accounts and sale across credit accounts, so each voucher header amount is counted once.
      distribute(amount(voucher.purchaseQty ?? voucher.purchase), voucher.entries || [], 'drAmount', rows);
      distribute(amount(voucher.saleQty ?? voucher.sale), voucher.entries || [], 'crAmount', rows);
    });
    const resultRows = [...rows.values()].map((row) => {
      const net = row.debit - row.credit;
      return { accountId: row.accountId, accountCode: row.accountCode, accountName: row.accountName, purchase: row.purchase, sale: row.sale, debit: net > 0 ? net : 0, credit: net < 0 ? Math.abs(net) : 0 };
    }).filter((row) => row.purchase || row.sale || row.debit || row.credit);
    const totals = resultRows.reduce((sum, row) => ({ purchase: sum.purchase + row.purchase, sale: sum.sale + row.sale, debit: sum.debit + row.debit, credit: sum.credit + row.credit }), { purchase: 0, sale: 0, debit: 0, credit: 0 });
    res.json({ rows: resultRows, totals });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
