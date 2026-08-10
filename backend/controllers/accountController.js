const Account = require('../models/Account');

// Mongoose enum validators reject '' unless '' is explicitly in the enum list.
// Since headGroup/expenseGroup are optional selects, an unselected option
// arrives as '' from the form — convert that to undefined so Mongoose treats
// the field as "not set" instead of "set to an invalid value".
const emptyToUndefined = (value) => (value === '' ? undefined : value);

// @desc  Create a new account
// @route POST /api/accounts
exports.createAccount = async (req, res) => {
  try {
    const { accountName, accountCode, bfDr, bfCr, headGroup, expenseGroup, bfDate } = req.body;

    if (!accountName || !accountCode || !bfDate) {
      return res.status(400).json({ message: 'Account Name, Account Code and BF Date are required.' });
    }

    const existing = await Account.findOne({ accountCode });
    if (existing) {
      return res.status(400).json({ message: 'Account Code already exists.' });
    }

    const account = await Account.create({
      accountName,
      accountCode,
      bfDr,
      bfCr,
      headGroup: emptyToUndefined(headGroup),
      expenseGroup: emptyToUndefined(expenseGroup),
      bfDate
    });

    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all accounts
// @route GET /api/accounts
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update an existing account
// @route PUT /api/accounts/:id
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, accountCode, bfDr, bfCr, headGroup, expenseGroup, bfDate } = req.body;

    if (!accountName || !accountCode || !bfDate) {
      return res.status(400).json({ message: 'Account Name, Account Code and BF Date are required.' });
    }

    const existing = await Account.findOne({ accountCode, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Account Code already exists.' });
    }

    const account = await Account.findByIdAndUpdate(
      id,
      {
        accountName,
        accountCode,
        bfDr,
        bfCr,
        headGroup: emptyToUndefined(headGroup),
        expenseGroup: emptyToUndefined(expenseGroup),
        bfDate
      },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete an account
// @route DELETE /api/accounts/:id
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findByIdAndDelete(id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    res.json({ message: 'Account deleted.', _id: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};