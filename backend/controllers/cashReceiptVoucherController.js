const CashReceiptVoucher = require('../models/CashReceiptVoucher');
const Counter = require('../models/Counter'); // shared generic counter, also used by Journal Voucher

// Voucher numbers are generated as CRV-<seq>. The counter is offset by 877 so the very
// first voucher generated on a fresh database comes out as CRV-878 (matching the existing
// numbering). Adjust the offset below (or seed the Counter doc directly) if you need a
// different starting point.
const VOUCHER_NO_OFFSET = 877;

async function getNextVoucherNo() {
  const counter = await Counter.findByIdAndUpdate(
    'cashReceiptVoucher',
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `CRV-${counter.seq + VOUCHER_NO_OFFSET}`;
}

function computeTotals(entries) {
  return entries.reduce(
    (totals, line) => {
      totals.totalDr += Number(line.drAmount) || 0;
      totals.totalCr += Number(line.crAmount) || 0;
      return totals;
    },
    { totalDr: 0, totalCr: 0 }
  );
}

function validateEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return 'At least one Account Head line is required.';
  }

  for (let i = 0; i < entries.length; i++) {
    const line = entries[i];
    if (!line.accountHead) {
      return `Row ${i + 1}: Account Head is required.`;
    }
  }

  return null;
}

// @desc  Preview the next voucher number WITHOUT consuming it
// @route GET /api/cash-receipt-vouchers/next-voucher-no
exports.previewNextVoucherNo = async (req, res) => {
  try {
    const counter = await Counter.findById('cashReceiptVoucher');
    const nextSeq = (counter ? counter.seq : 0) + 1 + VOUCHER_NO_OFFSET;
    res.json({ voucherNo: `CRV-${nextSeq}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create a new cash receipt voucher
// @route POST /api/cash-receipt-vouchers
exports.createCashReceiptVoucher = async (req, res) => {
  try {
    const { date, narration, purchase, sale, cashInHand, entries } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }
    if (!narration || !narration.trim()) {
      return res.status(400).json({ message: 'Narration is required.' });
    }

    const validationError = validateEntries(entries);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { totalDr, totalCr } = computeTotals(entries);
    const voucherNo = await getNextVoucherNo();

    const voucher = await CashReceiptVoucher.create({
      voucherNo,
      date,
      narration,
      purchase: Number(purchase) || 0,
      sale: Number(sale) || 0,
      cashInHand: Number(cashInHand) || 0,
      entries,
      totalDr,
      totalCr
    });

    const populated = await voucher.populate('entries.accountHead', 'accountName accountCode');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get cash receipt vouchers, optionally filtered by date range
// @route GET /api/cash-receipt-vouchers?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
exports.getCashReceiptVouchers = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = {};

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const vouchers = await CashReceiptVoucher.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('entries.accountHead', 'accountName accountCode');

    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get a single cash receipt voucher
// @route GET /api/cash-receipt-vouchers/:id
exports.getCashReceiptVoucherById = async (req, res) => {
  try {
    const voucher = await CashReceiptVoucher.findById(req.params.id).populate(
      'entries.accountHead',
      'accountName accountCode'
    );
    if (!voucher) {
      return res.status(404).json({ message: 'Cash receipt voucher not found.' });
    }
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update a cash receipt voucher (voucher number never changes)
// @route PUT /api/cash-receipt-vouchers/:id
exports.updateCashReceiptVoucher = async (req, res) => {
  try {
    const { date, narration, purchase, sale, cashInHand, entries } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }
    if (!narration || !narration.trim()) {
      return res.status(400).json({ message: 'Narration is required.' });
    }

    const validationError = validateEntries(entries);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { totalDr, totalCr } = computeTotals(entries);

    const voucher = await CashReceiptVoucher.findByIdAndUpdate(
      req.params.id,
      {
        date,
        narration,
        purchase: Number(purchase) || 0,
        sale: Number(sale) || 0,
        cashInHand: Number(cashInHand) || 0,
        entries,
        totalDr,
        totalCr
      },
      { new: true, runValidators: true }
    ).populate('entries.accountHead', 'accountName accountCode');

    if (!voucher) {
      return res.status(404).json({ message: 'Cash receipt voucher not found.' });
    }

    res.json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete a cash receipt voucher
// @route DELETE /api/cash-receipt-vouchers/:id
exports.deleteCashReceiptVoucher = async (req, res) => {
  try {
    const voucher = await CashReceiptVoucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: 'Cash receipt voucher not found.' });
    }
    res.json({ message: 'Cash receipt voucher deleted.', _id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};