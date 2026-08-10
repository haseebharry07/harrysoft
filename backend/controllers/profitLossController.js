const Account = require('../models/Account');
const JournalVoucher = require('../models/JournalVoucher');
const CashReceiptVoucher = require('../models/CashReceiptVoucher');
const CashPaymentVoucher = require('../models/CashPaymentVoucher');

const amount = (value) => Number(value) || 0;
const rangeFilter = (fromDate, toDate) => {
  const filter = {};
  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = new Date(fromDate);
    if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); filter.date.$lte = end; }
  }
  return filter;
};

// @route GET /api/profit-loss?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
exports.getProfitLoss = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    if ((fromDate && !toDate) || (!fromDate && toDate)) return res.status(400).json({ message: 'Select both From Date and To Date, or leave both blank.' });
    if (fromDate && new Date(fromDate) > new Date(toDate)) return res.status(400).json({ message: 'From Date cannot be after To Date.' });
    const [accounts, journal, receipts, payments] = await Promise.all([
      Account.find().sort({ accountName: 1 }).lean(),
      JournalVoucher.find(rangeFilter(fromDate, toDate)).lean(),
      CashReceiptVoucher.find(rangeFilter(fromDate, toDate)).lean(),
      CashPaymentVoucher.find(rangeFilter(fromDate, toDate)).lean()
    ]);
    const accountLookup = new Map(accounts.map((account) => [String(account._id), account]));
    const incomeAmounts = new Map();
    const expenseAmounts = new Map();
    const add = (map, accountId, value) => map.set(String(accountId), (map.get(String(accountId)) || 0) + amount(value));
    // Confirmed business rule: CPV and JV debit entries are expenses; CRV and JV credit entries are income.
    [...payments, ...journal].forEach((voucher) => (voucher.entries || []).forEach((line) => add(expenseAmounts, line.accountHead, line.drAmount)));
    [...receipts, ...journal].forEach((voucher) => (voucher.entries || []).forEach((line) => add(incomeAmounts, line.accountHead, line.crAmount)));
    const toRows = (map) => [...map.entries()].map(([accountId, value]) => {
      const account = accountLookup.get(accountId);
      return { accountId, accountName: account?.accountName || 'Deleted account', headGroup: account?.headGroup || '', amount: value };
    }).filter((row) => row.amount > 0).sort((a, b) => a.accountName.localeCompare(b.accountName));
    const income = toRows(incomeAmounts);
    const expenses = toRows(expenseAmounts);
    const totalIncome = income.reduce((sum, row) => sum + row.amount, 0);
    const totalExpenses = expenses.reduce((sum, row) => sum + row.amount, 0);
    res.json({ income, expenses, totalIncome, totalExpenses, profit: totalIncome - totalExpenses });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
