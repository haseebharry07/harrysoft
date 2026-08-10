import { useState } from 'react';
import api from '../api/axiosConfig';
import './TrialBalance.css';

const formatAmount = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (value) => new Date(value).toLocaleDateString();
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export default function TrialBalance() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { const { data } = await api.get('/trial-balance', { params: { fromDate: fromDate || undefined, toDate: toDate || undefined } }); setReport(data); }
    catch (err) { setError(err.response?.data?.message || 'Unable to load trial balance.'); setReport(null); }
    finally { setLoading(false); }
  };

  const printReport = () => {
    if (!report) return;
    const period = fromDate && toDate ? `${formatDate(fromDate)} to ${formatDate(toDate)}` : 'All dates';
    const createdOn = new Date().toLocaleString();
    const rows = report.rows.length
      ? report.rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.accountName)}</td><td class="amount">${formatAmount(row.purchase)}</td><td class="amount">${formatAmount(row.sale)}</td><td class="amount">${formatAmount(row.debit)}</td><td class="amount">${formatAmount(row.credit)}</td><td class="amount">${row.debit ? formatAmount(row.debit) : '-'}</td><td class="amount">${row.credit ? formatAmount(row.credit) : '-'}</td></tr>`).join('')
      : '<tr><td colspan="8" class="empty">No account activity found for this period.</td></tr>';
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) { setError('Please allow pop-ups to print the Trial Balance.'); return; }
    printWindow.document.write(`<!doctype html><html><head><title>Trial Balance</title><style>body{margin:0;padding:32px;font-family:Arial,sans-serif;color:#172033}.company{display:flex;align-items:center;gap:14px;padding-bottom:18px;border-bottom:3px solid #2563eb}.logo{display:grid;place-items:center;width:52px;height:52px;border-radius:12px;background:#2563eb;color:#fff;font-size:22px;font-weight:800}.company-name{font-size:24px;font-weight:800}.company-subtitle{margin-top:4px;color:#64748b;font-size:13px}.title{text-align:center;margin:24px 0 18px;font-size:21px;font-weight:800}.details{display:flex;justify-content:space-between;gap:24px;margin-bottom:18px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0}.label{display:block;margin-bottom:4px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:9px 8px;border:1px solid #cbd5e1;text-align:left}th{background:#eaf1ff;color:#1e3a8a;font-size:10px;text-transform:uppercase}.amount{text-align:right;font-variant-numeric:tabular-nums}tfoot{font-weight:800;background:#eff6ff}.empty{text-align:center;padding:24px;color:#64748b}@media print{body{padding:16px}@page{size:landscape;margin:10mm}}</style></head><body><header class="company"><div class="logo">AA</div><div><div class="company-name">Accounting App</div><div class="company-subtitle">Trial Balance Report</div></div></header><h1 class="title">TRIAL BALANCE</h1><div class="details"><div><span class="label">Report period</span><strong>${escapeHtml(period)}</strong></div><div><span class="label">Created on</span><strong>${escapeHtml(createdOn)}</strong></div></div><table><thead><tr><th rowspan="2">Sr.</th><th rowspan="2">Account Title</th><th class="amount" rowspan="2">Purchase</th><th class="amount" rowspan="2">Sale</th><th class="amount" rowspan="2">Debit Balance</th><th class="amount" rowspan="2">Credit Balance</th><th class="amount" colspan="2">Balance</th></tr><tr><th class="amount">Dr</th><th class="amount">Cr</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="2">Total</td><td class="amount">${formatAmount(report.totals.purchase)}</td><td class="amount">${formatAmount(report.totals.sale)}</td><td class="amount">${formatAmount(report.totals.debit)}</td><td class="amount">${formatAmount(report.totals.credit)}</td><td class="amount">${formatAmount(report.totals.debit)}</td><td class="amount">${formatAmount(report.totals.credit)}</td></tr></tfoot></table></body></html>`);
    printWindow.document.close(); printWindow.focus(); printWindow.print();
  };

  return <section className="trial-balance-page">
    <div className="trial-balance-heading"><h2>Trial Balance</h2><p>Account balances, purchases, and sales from posted cash and journal vouchers.</p></div>
    <form className="trial-balance-filter" onSubmit={loadReport}><label>From date<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label><label>End date<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label><button type="submit" disabled={loading}>{loading ? 'Loading...' : 'View Trial Balance'}</button></form>
    {error && <div className="trial-balance-error" role="alert">{error}</div>}
    {report && <><div className="trial-balance-table-wrap"><table className="trial-balance-table"><thead><tr><th rowSpan="2">Sr.</th><th rowSpan="2">Account Title</th><th className="amount" rowSpan="2">Purchase</th><th className="amount" rowSpan="2">Sale</th><th className="amount" rowSpan="2">Debit Balance</th><th className="amount" rowSpan="2">Credit Balance</th><th className="amount" colSpan="2">Balance</th></tr><tr><th className="amount">Dr</th><th className="amount">Cr</th></tr></thead><tbody>{report.rows.length ? report.rows.map((row, index) => <tr key={row.accountId}><td>{index + 1}</td><td>{row.accountName}</td><td className="amount">{formatAmount(row.purchase)}</td><td className="amount">{formatAmount(row.sale)}</td><td className="amount">{formatAmount(row.debit)}</td><td className="amount">{formatAmount(row.credit)}</td><td className="amount balance-cell">{row.debit ? formatAmount(row.debit) : '-'}</td><td className="amount balance-cell">{row.credit ? formatAmount(row.credit) : '-'}</td></tr>) : <tr><td colSpan="8" className="no-trial-balance-rows">No account activity found for this period.</td></tr>}</tbody><tfoot><tr><td colSpan="2">Total</td><td className="amount">{formatAmount(report.totals.purchase)}</td><td className="amount">{formatAmount(report.totals.sale)}</td><td className="amount">{formatAmount(report.totals.debit)}</td><td className="amount">{formatAmount(report.totals.credit)}</td><td className="amount balance-cell">{formatAmount(report.totals.debit)}</td><td className="amount balance-cell">{formatAmount(report.totals.credit)}</td></tr></tfoot></table></div><div className="trial-balance-actions"><button type="button" onClick={printReport}>Print Trial Balance</button></div></>}
  </section>;
}
