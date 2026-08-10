import { useEffect, useMemo, useState } from 'react';
import api from '../api/axiosConfig';
import './AllVouchers.css';
import JournalVoucherForm from './JournalVoucherForm';
import CashReceiptVoucherForm from './CashReceiptVoucherForm';
import CashPaymentVoucherForm from './CashPaymentVoucherForm';

const voucherSources = [
  { endpoint: '/journal-vouchers', type: 'Journal Voucher', Form: JournalVoucherForm },
  { endpoint: '/cash-receipt-vouchers', type: 'Cash Receipt Voucher', Form: CashReceiptVoucherForm },
  { endpoint: '/cash-payment-vouchers', type: 'Cash Payment Voucher', Form: CashPaymentVoucherForm },
];
const formatAmount = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AllVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [editingVoucher, setEditingVoucher] = useState(null);
  const isAdmin = JSON.parse(localStorage.getItem('authSession') || 'null')?.user?.role === 'admin';

  const loadVouchers = async (range = {}) => {
    setLoading(true); setError('');
    try {
      const params = range.fromDate || range.toDate ? range : undefined;
      const responses = await Promise.all(voucherSources.map(({ endpoint }) => api.get(endpoint, { params })));
      setVouchers(responses.flatMap((response, index) => response.data.map((voucher) => ({ ...voucher, ...voucherSources[index] }))).sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) { setError(err.response?.data?.message || 'Unable to load vouchers. Please try again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadVouchers(); }, []);

  const totals = useMemo(() => vouchers.reduce((summary, voucher) => ({ dr: summary.dr + (Number(voucher.totalDr) || 0), cr: summary.cr + (Number(voucher.totalCr) || 0) }), { dr: 0, cr: 0 }), [vouchers]);
  const difference = totals.dr - totals.cr;
  const filter = (event) => {
    event.preventDefault();
    if ((fromDate && !toDate) || (!fromDate && toDate)) { setError('Select both dates, or clear both to view all vouchers.'); return; }
    loadVouchers({ fromDate, toDate });
  };
  const deleteVoucher = async (voucher) => {
    if (!window.confirm(`Delete ${voucher.voucherNo}? This cannot be undone.`)) return;
    try { await api.delete(`${voucher.endpoint}/${voucher._id}`); loadVouchers({ fromDate, toDate }); }
    catch (err) { setError(err.response?.data?.message || 'Unable to delete voucher.'); }
  };
  const printVoucher = (voucher) => {
    const escape = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    const win = window.open('', '_blank', 'width=780,height=700');
    if (!win) { setError('Please allow pop-ups to print a voucher.'); return; }
    win.document.write(`<!doctype html><html><head><title>${escape(voucher.voucherNo)}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#111827}header{display:flex;justify-content:space-between;border-bottom:2px solid #2563eb;padding-bottom:16px;margin-bottom:24px}h1{margin:0;font-size:24px}.label{color:#64748b;font-size:12px;text-transform:uppercase}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:24px 0}.box{border:1px solid #dbeafe;padding:16px;border-radius:8px}.amount{font-size:22px;font-weight:bold}footer{margin-top:42px;border-top:1px solid #e5e7eb;padding-top:14px;color:#64748b;font-size:12px}@media print{body{padding:0}}</style></head><body><header><div><div class="label">Accounting App</div><h1>${escape(voucher.type)}</h1></div><div><div class="label">Voucher no.</div><strong>${escape(voucher.voucherNo)}</strong><br><span>${escape(new Date(voucher.date).toLocaleDateString())}</span></div></header><div class="box"><div class="label">Narration</div><p>${escape(voucher.narration || '-')}</p></div><div class="grid"><div class="box"><div class="label">Total debit</div><div class="amount">${formatAmount(voucher.totalDr)}</div></div><div class="box"><div class="label">Total credit</div><div class="amount">${formatAmount(voucher.totalCr)}</div></div></div><footer>Sample print template - layout and details can be customized.</footer></body></html>`);
    win.document.close(); win.focus(); win.print();
  };

  return <section className="all-vouchers">
    <div className="all-vouchers-heading"><div><h2>All Vouchers</h2><p>Journal, cash receipt, and cash payment vouchers in one view.</p></div></div>
    <form className="voucher-filter" onSubmit={filter}><label>From date<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label><label>To date<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label><button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Apply filter'}</button><button type="button" className="clear-filter" onClick={() => { setFromDate(''); setToDate(''); loadVouchers(); }}>Clear</button></form>
    {error && <div className="voucher-error" role="alert">{error}</div>}
    {!loading && !error && <div className="voucher-table-wrap"><table className="voucher-table"><thead><tr><th>Date</th><th>Voucher no.</th><th>Voucher type</th><th>Narration</th><th className="amount">Total DR</th><th className="amount">Total CR</th><th className="amount">Difference</th><th>Print</th><th>Edit</th><th>Delete</th></tr></thead><tbody>{vouchers.length ? vouchers.map((voucher) => { const rowDifference = (Number(voucher.totalDr) || 0) - (Number(voucher.totalCr) || 0); return <tr key={`${voucher.type}-${voucher._id}`}><td>{new Date(voucher.date).toLocaleDateString()}</td><td>{voucher.voucherNo}</td><td><span className="voucher-type">{voucher.type}</span></td><td>{voucher.narration || '-'}</td><td className="amount">{formatAmount(voucher.totalDr)}</td><td className="amount">{formatAmount(voucher.totalCr)}</td><td className={`amount ${rowDifference ? 'unbalanced' : ''}`}>{formatAmount(rowDifference)}</td><td><button className="voucher-action print" onClick={() => printVoucher(voucher)}>Print</button></td><td>{isAdmin ? <button className="voucher-action edit" onClick={() => setEditingVoucher(voucher)}>Edit</button> : '-'}</td><td>{isAdmin ? <button className="voucher-action delete" onClick={() => deleteVoucher(voucher)}>Delete</button> : '-'}</td></tr>; }) : <tr><td colSpan="10" className="no-vouchers">No vouchers found for this period.</td></tr>}</tbody><tfoot><tr><td colSpan="4">Grand total ({vouchers.length} voucher{vouchers.length === 1 ? '' : 's'})</td><td className="amount">{formatAmount(totals.dr)}</td><td className="amount">{formatAmount(totals.cr)}</td><td className={`amount ${difference ? 'unbalanced' : ''}`}>{formatAmount(difference)}</td><td colSpan="3"></td></tr></tfoot></table></div>}
    {editingVoucher && <div className="voucher-modal-backdrop" onClick={() => setEditingVoucher(null)}><div className="voucher-modal" onClick={(e) => e.stopPropagation()}><editingVoucher.Form voucherId={editingVoucher._id} onSaved={() => { setEditingVoucher(null); loadVouchers({ fromDate, toDate }); }} onCancel={() => setEditingVoucher(null)} /></div></div>}
  </section>;
}
