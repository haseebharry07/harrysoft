const JournalVoucher = require('../models/JournalVoucher');
const Counter = require('../models/Counter');

// Voucher numbers are generated as JV-<seq>. The counter is offset by 876 so the very
// first voucher generated on a fresh database comes out as JV-877 (matching the existing
// numbering). Adjust the offset below (or seed the Counter doc directly) if you need a
// different starting point.
const VOUCHER_NO_OFFSET = 876;

async function getNextVoucherNo() {
  const counter = await Counter.findByIdAndUpdate(
    'journalVoucher',
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `JV-${counter.seq + VOUCHER_NO_OFFSET}`;
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
// @route GET /api/journal-vouchers/next-voucher-no
exports.previewNextVoucherNo = async (req, res) => {
  try {
    const counter = await Counter.findById('journalVoucher');
    const nextSeq = (counter ? counter.seq : 0) + 1 + VOUCHER_NO_OFFSET;
    res.json({ voucherNo: `JV-${nextSeq}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create a new journal voucher
// @route POST /api/journal-vouchers
exports.createJournalVoucher = async (req, res) => {
  try {
    const { date, narration, purchaseQty, saleQty, cashInHand, entries } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }

    const validationError = validateEntries(entries);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { totalDr, totalCr } = computeTotals(entries);
    const voucherNo = await getNextVoucherNo();

    const voucher = await JournalVoucher.create({
      voucherNo,
      date,
      narration,
      purchaseQty: Number(purchaseQty) || 0,
      saleQty: Number(saleQty) || 0,
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

// @desc  Get journal vouchers, optionally filtered by date range
// @route GET /api/journal-vouchers?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
exports.getJournalVouchers = async (req, res) => {
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

    const vouchers = await JournalVoucher.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('entries.accountHead', 'accountName accountCode');

    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get a single journal voucher
// @route GET /api/journal-vouchers/:id
exports.getJournalVoucherById = async (req, res) => {
  try {
    const voucher = await JournalVoucher.findById(req.params.id).populate(
      'entries.accountHead',
      'accountName accountCode'
    );
    if (!voucher) {
      return res.status(404).json({ message: 'Journal voucher not found.' });
    }
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update a journal voucher (voucher number never changes)
// @route PUT /api/journal-vouchers/:id
exports.updateJournalVoucher = async (req, res) => {
  try {
    const { date, narration, purchaseQty, saleQty, cashInHand, entries } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }

    const validationError = validateEntries(entries);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { totalDr, totalCr } = computeTotals(entries);

    const voucher = await JournalVoucher.findByIdAndUpdate(
      req.params.id,
      {
        date,
        narration,
        purchaseQty: Number(purchaseQty) || 0,
        saleQty: Number(saleQty) || 0,
        cashInHand: Number(cashInHand) || 0,
        entries,
        totalDr,
        totalCr
      },
      { new: true, runValidators: true }
    ).populate('entries.accountHead', 'accountName accountCode');

    if (!voucher) {
      return res.status(404).json({ message: 'Journal voucher not found.' });
    }

    res.json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete a journal voucher
// @route DELETE /api/journal-vouchers/:id
exports.deleteJournalVoucher = async (req, res) => {
  try {
    const voucher = await JournalVoucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: 'Journal voucher not found.' });
    }
    res.json({ message: 'Journal voucher deleted.', _id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};