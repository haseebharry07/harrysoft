import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import './Ledger.css';

const formatAmount = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatBalance = (value) => `${formatAmount(Math.abs(value))} ${Number(value) >= 0 ? 'Dr' : 'Cr'}`;
const formatDate = (value) => new Date(value).toLocaleDateString();
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export default function Ledger() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/accounts')
      .then((res) => setAccounts(res.data.sort((a, b) => a.accountName.localeCompare(b.accountName))))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load accounts.'));
  }, []);

  const loadLedger = async (event) => {
    event.preventDefault();
    setError('');
    if (!accountId) { setError('Please select an account.'); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/ledger', { params: { accountId, fromDate: fromDate || undefined, toDate: toDate || undefined } });
      setLedger(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load the ledger.');
      setLedger(null);
    } finally { setLoading(false); }
  };

  const printLedger = () => {
    if (!ledger) return;
    const period = fromDate && toDate ? `${formatDate(fromDate)} to ${formatDate(toDate)}` : 'All dates';
    const tableRows = ledger.rows.length
      ? ledger.rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.voucherNo)}</td><td>${formatDate(row.date)}</td><td>${escapeHtml(row.narration || '-')}</td><td class="amount">${formatAmount(row.purchase)}</td><td class="amount">${formatAmount(row.sale)}</td><td class="amount">${formatAmount(row.debit)}</td><td class="amount">${formatAmount(row.credit)}</td><td class="amount">${formatBalance(row.balance)}</td></tr>`).join('')
      : '<tr><td colspan="9" class="empty">No vouchers found for this account and date range.</td></tr>';
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) { setError('Please allow pop-ups to print the ledger.'); return; }
    printWindow.document.write(`<!doctype html><html><head><title>Ledger - ${escapeHtml(ledger.account.accountName)}</title><style>body{margin:0;padding:32px;font-family:Arial,sans-serif;color:#172033}.company{display:flex;align-items:center;gap:14px;padding-bottom:18px;border-bottom:3px solid #2563eb}.logo{display:grid;place-items:center;width:52px;height:52px;border-radius:12px;background:#2563eb;color:#fff;font-size:22px;font-weight:800}.company-name{font-size:24px;font-weight:800}.company-subtitle{margin-top:4px;color:#64748b;font-size:13px}.title{text-align:center;margin:24px 0 18px;font-size:21px;font-weight:800}.details{display:flex;justify-content:space-between;gap:24px;margin-bottom:18px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0}.label{display:block;margin-bottom:4px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase}.balance{font-weight:700}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:9px 8px;border:1px solid #cbd5e1;text-align:left;vertical-align:top}th{background:#eaf1ff;color:#1e3a8a;font-size:10px;text-transform:uppercase}.amount{text-align:right;font-variant-numeric:tabular-nums}tfoot{font-weight:800;background:#eff6ff}.empty{text-align:center;padding:24px;color:#64748b}@media print{body{padding:16px}@page{size:landscape;margin:10mm}}</style></head><body><header class="company"><div class="logo">AA</div><div><div class="company-name">Accounting App</div><div class="company-subtitle">General Ledger Statement</div></div></header><h1 class="title">GENERAL LEDGER: ${escapeHtml(ledger.account.accountName)}</h1><div class="details"><div><span class="label">Selected account</span><strong>${escapeHtml(ledger.account.accountName)} (${escapeHtml(ledger.account.accountCode)})</strong></div><div><span class="label">Period</span><strong>${escapeHtml(period)}</strong></div><div><span class="label">Opening balance</span><strong class="balance">${formatBalance(ledger.openingBalance)}</strong></div></div><table><thead><tr><th>Sr.</th><th>V-No.</th><th>Date</th><th>Description / Narration</th><th class="amount">Purchase</th><th class="amount">Sale</th><th class="amount">Dr</th><th class="amount">Cr</th><th class="amount">Balance</th></tr></thead><tbody>${tableRows}</tbody><tfoot><tr><td colspan="4">Total</td><td class="amount">${formatAmount(ledger.totals.purchase)}</td><td class="amount">${formatAmount(ledger.totals.sale)}</td><td class="amount">${formatAmount(ledger.totals.debit)}</td><td class="amount">${formatAmount(ledger.totals.credit)}</td><td class="amount">${formatBalance(ledger.closingBalance)}</td></tr></tfoot></table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return <section className="ledger-page">
    <div className="ledger-heading"><h2>General Ledger</h2><p>Select an account and period to view its voucher entries.</p></div>
    <form className="ledger-filter" onSubmit={loadLedger}>
      <label>From date<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label>
      <label>End date<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label>
      <label className="account-select">Account<select value={accountId} onChange={(e) => { setAccountId(e.target.value); setLedger(null); }}><option value="">Select account</option>{accounts.map((account) => <option key={account._id} value={account._id}>{account.accountName} ({account.accountCode})</option>)}</select></label>
      <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'View ledger'}</button>
    </form>
    {error && <div className="ledger-error" role="alert">{error}</div>}
    {ledger && <>
      <div className="ledger-account"><strong>GENERAL LEDGER: {ledger.account.accountName}</strong><span>Opening balance: {formatBalance(ledger.openingBalance)}</span></div>
      <div className="ledger-table-wrap"><table className="ledger-table"><thead><tr><th>Sr.</th><th>V-No.</th><th>Date</th><th>Description / Narration</th><th className="amount">Purchase</th><th className="amount">Sale</th><th className="amount">Dr</th><th className="amount">Cr</th><th className="amount">Balance</th></tr></thead><tbody>{ledger.rows.length ? ledger.rows.map((row, index) => <tr key={row.id}><td>{index + 1}</td><td title={row.voucherType}>{row.voucherNo}</td><td>{formatDate(row.date)}</td><td>{row.narration || '-'}</td><td className="amount">{formatAmount(row.purchase)}</td><td className="amount">{formatAmount(row.sale)}</td><td className="amount">{formatAmount(row.debit)}</td><td className="amount">{formatAmount(row.credit)}</td><td className="amount">{formatBalance(row.balance)}</td></tr>) : <tr><td colSpan="9" className="no-ledger-rows">No vouchers found for this account and date range.</td></tr>}</tbody><tfoot><tr><td colSpan="4">Total</td><td className="amount">{formatAmount(ledger.totals.purchase)}</td><td className="amount">{formatAmount(ledger.totals.sale)}</td><td className="amount">{formatAmount(ledger.totals.debit)}</td><td className="amount">{formatAmount(ledger.totals.credit)}</td><td className="amount">{formatBalance(ledger.closingBalance)}</td></tr></tfoot></table></div>
      <div className="ledger-actions"><button type="button" onClick={printLedger}>Print Ledger</button></div>
    </>}
  </section>;
}
