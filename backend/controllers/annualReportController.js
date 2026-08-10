const Account = require('../models/Account');
const JournalVoucher = require('../models/JournalVoucher');
const CashReceiptVoucher = require('../models/CashReceiptVoucher');
const CashPaymentVoucher = require('../models/CashPaymentVoucher');
const amount = (v) => Number(v) || 0;
const beforeFilter = (date) => date ? { date: { $lt: new Date(date) } } : {};
const rangeFilter = (fromDate, toDate) => { const filter = {}; if (fromDate || toDate) { filter.date = {}; if (fromDate) filter.date.$gte = new Date(fromDate); if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); filter.date.$lte = end; } } return filter; };
const totals = (vouchers, accountId) => vouchers.reduce((sum, voucher) => (voucher.entries || []).reduce((inner, line) => String(line.accountHead) === String(accountId) ? inner + amount(line.drAmount) - amount(line.crAmount) : inner, sum), 0);

exports.getAnnualReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    if (!fromDate || !toDate) return res.status(400).json({ message: 'Select both Start Date and End Date.' });
    if (new Date(fromDate) > new Date(toDate)) return res.status(400).json({ message: 'Start Date cannot be after End Date.' });
    const bank = await Account.findOne({ accountCode: '11' }).lean();
    if (!bank) return res.status(404).json({ message: 'Bank account with account code 11 was not found.' });
    const [accounts, beforeJV, beforeCRV, beforeCPV, jv, crv, cpv] = await Promise.all([
      Account.find().lean(), JournalVoucher.find(beforeFilter(fromDate)).lean(), CashReceiptVoucher.find(beforeFilter(fromDate)).lean(), CashPaymentVoucher.find(beforeFilter(fromDate)).lean(),
      JournalVoucher.find(rangeFilter(fromDate, toDate)).lean(), CashReceiptVoucher.find(rangeFilter(fromDate, toDate)).lean(), CashPaymentVoucher.find(rangeFilter(fromDate, toDate)).lean()
    ]);
    const openingBalance = amount(bank.bfDr) - amount(bank.bfCr) + totals(beforeJV, bank._id) + totals(beforeCRV, bank._id) + totals(beforeCPV, bank._id);
    const accountById = new Map(accounts.map((account) => [String(account._id), account]));
    const income = new Map(); const expenses = new Map();
    const add = (map, id, v) => map.set(String(id), (map.get(String(id)) || 0) + amount(v));
    // Income: CRV/JV credits. Expenses: CPV/JV debits, matching the Profit & Loss report rule.
    [...crv, ...jv].forEach((voucher) => (voucher.entries || []).forEach((line) => add(income, line.accountHead, line.crAmount)));
    [...cpv, ...jv].forEach((voucher) => (voucher.entries || []).forEach((line) => add(expenses, line.accountHead, line.drAmount)));
    const incomeTotal = [...income.values()].reduce((sum, v) => sum + v, 0);
    const expenseRows = [...expenses.entries()].filter(([, v]) => v > 0).map(([id, value]) => ({ accountId: id, accountTitle: accountById.get(id)?.accountName || 'Deleted account', amount: value })).sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));
    const expenseTotal = expenseRows.reduce((sum, row) => sum + row.amount, 0);
    res.json({ bank: { _id: bank._id, accountTitle: bank.accountName }, openingBalance, incomeTotal, expenseRows, expenseTotal, closingBalance: openingBalance + incomeTotal - expenseTotal });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
