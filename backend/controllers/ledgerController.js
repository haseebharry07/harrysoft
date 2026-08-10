const Account = require('../models/Account');
const JournalVoucher = require('../models/JournalVoucher');
const CashReceiptVoucher = require('../models/CashReceiptVoucher');
const CashPaymentVoucher = require('../models/CashPaymentVoucher');

const toAmount = (value) => Number(value) || 0;

function dateFilter(toDate) {
  if (!toDate) return {};
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);
  return { date: { $lte: end } };
}

function voucherRows(vouchers, voucherType, accountId, purchaseField = 'purchase', saleField = 'sale') {
  return vouchers.flatMap((voucher) => {
    const matchingLines = (voucher.entries || []).filter((line) => String(line.accountHead) === String(accountId));
    if (!matchingLines.length) return [];

    return [{
      id: `${voucherType}-${voucher._id}`,
      voucherNo: voucher.voucherNo,
      voucherType,
      date: voucher.date,
      narration: voucher.narration || '',
      purchase: toAmount(voucher[purchaseField]),
      sale: toAmount(voucher[saleField]),
      debit: matchingLines.reduce((sum, line) => sum + toAmount(line.drAmount), 0),
      credit: matchingLines.reduce((sum, line) => sum + toAmount(line.crAmount), 0)
    }];
  });
}

// @desc Get a general ledger for one account and optional date range
// @route GET /api/ledger?accountId=...&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
exports.getLedger = async (req, res) => {
  try {
    const { accountId, fromDate, toDate } = req.query;
    if (!accountId) return res.status(400).json({ message: 'Please select an account.' });
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      return res.status(400).json({ message: 'Select both From Date and To Date, or leave both blank.' });
    }
    if (fromDate && new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ message: 'From Date cannot be after To Date.' });
    }

    const account = await Account.findById(accountId).lean();
    if (!account) return res.status(404).json({ message: 'Account not found.' });

    const filter = { ...dateFilter(toDate), 'entries.accountHead': account._id };
    const [journalVouchers, receiptVouchers, paymentVouchers] = await Promise.all([
      JournalVoucher.find(filter).lean(),
      CashReceiptVoucher.find(filter).lean(),
      CashPaymentVoucher.find(filter).lean()
    ]);

    const allRows = [
      ...voucherRows(journalVouchers, 'JV', account._id, 'purchaseQty', 'saleQty'),
      ...voucherRows(receiptVouchers, 'CRV', account._id),
      ...voucherRows(paymentVouchers, 'CPV', account._id)
    ].sort((a, b) => new Date(a.date) - new Date(b.date) || a.voucherNo.localeCompare(b.voucherNo));

    let runningBalance = toAmount(account.bfDr) - toAmount(account.bfCr);
    const visibleRows = [];
    for (const row of allRows) {
      runningBalance += row.debit - row.credit;
      if (!fromDate || new Date(row.date) >= new Date(fromDate)) {
        visibleRows.push({ ...row, balance: runningBalance });
      }
    }

    const openingBalance = visibleRows.length
      ? visibleRows[0].balance - visibleRows[0].debit + visibleRows[0].credit
      : runningBalance;
    const totals = visibleRows.reduce((sum, row) => ({
      purchase: sum.purchase + row.purchase,
      sale: sum.sale + row.sale,
      debit: sum.debit + row.debit,
      credit: sum.credit + row.credit
    }), { purchase: 0, sale: 0, debit: 0, credit: 0 });

    res.json({
      account: { _id: account._id, accountName: account.accountName, accountCode: account.accountCode },
      openingBalance,
      rows: visibleRows,
      totals,
      closingBalance: runningBalance
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
