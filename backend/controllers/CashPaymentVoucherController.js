const CashPaymentVoucher = require('../models/CashPaymentVoucher');
const Counter = require('../models/Counter'); // shared generic counter, also used by other vouchers

// Voucher numbers are generated as CPV-<seq>. The counter is offset by 877 so the very
// first voucher generated on a fresh database comes out as CPV-878 (matching the existing
// numbering). Adjust the offset below (or seed the Counter doc directly) if you need a
// different starting point.
const VOUCHER_NO_OFFSET = 877;

async function getNextVoucherNo() {
  const counter = await Counter.findByIdAndUpdate(
    'cashPaymentVoucher',
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `CPV-${counter.seq + VOUCHER_NO_OFFSET}`;
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
    const dr = Number(line.drAmount) || 0;
    const cr = Number(line.crAmount) || 0;
    if (dr === 0 && cr === 0) {
      return `Row ${i + 1}: enter a DR or CR amount.`;
    }
    if (dr > 0 && cr > 0) {
      return `Row ${i + 1}: enter only a DR amount or a CR amount, not both.`;
    }
  }

  const { totalDr, totalCr } = computeTotals(entries);
  if (totalDr.toFixed(2) !== totalCr.toFixed(2)) {
    return `Total DR (${totalDr.toFixed(2)}) must equal Total CR (${totalCr.toFixed(2)}).`;
  }

  return null;
}

// @desc  Preview the next voucher number WITHOUT consuming it
// @route GET /api/cash-payment-vouchers/next-voucher-no
exports.previewNextVoucherNo = async (req, res) => {
  try {
    const counter = await Counter.findById('cashPaymentVoucher');
    const nextSeq = (counter ? counter.seq : 0) + 1 + VOUCHER_NO_OFFSET;
    res.json({ voucherNo: `CPV-${nextSeq}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create a new cash payment voucher
// @route POST /api/cash-payment-vouchers
exports.createCashPaymentVoucher = async (req, res) => {
  try {
    const { date, narration, purchase, sale, cashInHand, entries } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }

    const validationError = validateEntries(entries);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { totalDr, totalCr } = computeTotals(entries);
    const voucherNo = await getNextVoucherNo();

    const voucher = await CashPaymentVoucher.create({
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

// @desc  Get cash payment vouchers, optionally filtered by date range
// @route GET /api/cash-payment-vouchers?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
exports.getCashPaymentVouchers = async (req, res) => {
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

    const vouchers = await CashPaymentVoucher.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('entries.accountHead', 'accountName accountCode');

    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get a single cash payment voucher
// @route GET /api/cash-payment-vouchers/:id
exports.getCashPaymentVoucherById = async (req, res) => {
  try {
    const voucher = await CashPaymentVoucher.findById(req.params.id).populate(
      'entries.accountHead',
      'accountName accountCode'
    );
    if (!voucher) {
      return res.status(404).json({ message: 'Cash payment voucher not found.' });
    }
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update a cash payment voucher (voucher number never changes)
// @route PUT /api/cash-payment-vouchers/:id
exports.updateCashPaymentVoucher = async (req, res) => {
  try {
    const { date, narration, purchase, sale, cashInHand, entries } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }

    const validationError = validateEntries(entries);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { totalDr, totalCr } = computeTotals(entries);

    const voucher = await CashPaymentVoucher.findByIdAndUpdate(
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
      return res.status(404).json({ message: 'Cash payment voucher not found.' });
    }

    res.json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete a cash payment voucher
// @route DELETE /api/cash-payment-vouchers/:id
exports.deleteCashPaymentVoucher = async (req, res) => {
  try {
    const voucher = await CashPaymentVoucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: 'Cash payment voucher not found.' });
    }
    res.json({ message: 'Cash payment voucher deleted.', _id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};