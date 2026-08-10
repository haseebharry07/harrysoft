import { useState } from 'react';
import api from '../api/axiosConfig';
import CashReceiptVoucherForm from './CashReceiptVoucherForm';

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function CashReceiptVoucherList() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [vouchers, setVouchers] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);

  const handleView = async (e) => {
    e.preventDefault();
    setError('');

    if (!fromDate || !toDate) {
      setError('Please select both From Date and To Date.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/cash-receipt-vouchers', { params: { fromDate, toDate } });
      setVouchers(res.data);
      setHasSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cash receipt vouchers.');
    } finally {
      setLoading(false);
    }
  };

  const refreshList = async () => {
    if (!fromDate || !toDate) return;
    const res = await api.get('/cash-receipt-vouchers', { params: { fromDate, toDate } });
    setVouchers(res.data);
  };

  const handleDelete = async (voucher) => {
    const confirmed = window.confirm(`Delete voucher ${voucher.voucherNo}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/cash-receipt-vouchers/${voucher._id}`);
      refreshList();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete voucher.');
    }
  };

  const closeEditModal = () => setEditingId(null);

  const handleSavedEdit = () => {
    closeEditModal();
    refreshList();
  };

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Cash Receipt Vouchers</h2>

      <form onSubmit={handleView} style={styles.filterRow}>
        <div style={styles.filterField}>
          <label style={styles.label}>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.viewButton} disabled={loading}>
          {loading ? 'Loading...' : 'View'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {hasSearched && !loading && (
        vouchers.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Voucher No</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Narration</th>
                <th style={styles.th}>Purchase</th>
                <th style={styles.th}>Sale</th>
                <th style={styles.th}>Total DR</th>
                <th style={styles.th}>Total CR</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v._id}>
                  <td style={styles.td}>{v.voucherNo}</td>
                  <td style={styles.td}>{new Date(v.date).toLocaleDateString()}</td>
                  <td style={styles.td}>{v.narration}</td>
                  <td style={styles.td}>{Number(v.purchase).toFixed(2)}</td>
                  <td style={styles.td}>{Number(v.sale).toFixed(2)}</td>
                  <td style={styles.td}>{Number(v.totalDr).toFixed(2)}</td>
                  <td style={styles.td}>{Number(v.totalCr).toFixed(2)}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        style={styles.iconButtonEdit}
                        title="Edit voucher"
                        onClick={() => setEditingId(v._id)}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        style={styles.iconButtonDelete}
                        title="Delete voucher"
                        onClick={() => handleDelete(v)}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>No cash receipt vouchers found for that date range.</div>
        )
      )}

      {editingId && (
        <div style={styles.overlay} onClick={closeEditModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <CashReceiptVoucherForm voucherId={editingId} onSaved={handleSavedEdit} onCancel={closeEditModal} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  filterRow: { display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' },
  filterField: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontWeight: 'bold', fontSize: 13 },
  input: { padding: 8, fontSize: 14, border: '1px solid #ccc', borderRadius: 4 },
  viewButton: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 'bold', height: 38 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: { border: '1px solid #ddd', padding: 8, background: '#f3f4f6', textAlign: 'left', fontSize: 13 },
  td: { border: '1px solid #ddd', padding: 8, fontSize: 13 },
  emptyState: { padding: 30, textAlign: 'center', color: '#6b7280', border: '1px dashed #ccc', borderRadius: 8, background: '#fafafa' },
  error: { background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 4, marginBottom: 12, fontSize: 14 },
  iconButtonEdit: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, border: '1px solid #93c5fd', background: '#eff6ff', color: '#2563eb', borderRadius: 4, cursor: 'pointer' },
  iconButtonDelete: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: 4, cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, zIndex: 1000, overflowY: 'auto' },
  modal: { background: '#fff', borderRadius: 8, width: '100%', maxWidth: 1020, margin: '0 16px 40px' }
};