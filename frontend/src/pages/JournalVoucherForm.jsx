import { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';


// Update this if your Journal Voucher list page is registered at a different path.
const JOURNAL_VOUCHER_LIST_ROUTE = '/journal-vouchers';

const emptyEntry = () => ({ accountHead: '', drAmount: '', crAmount: '' });

const todayIso = () => new Date().toISOString().substring(0, 10);

function TrashIcon() {
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

/**
 * Journal Voucher form.
 *
 * Props:
 *  - voucherId: string | null   -> when set, loads & edits that voucher; otherwise creates a new one
 *  - onSaved:   (voucher) => void  -> called after a successful create/update
 *  - onCancel:  () => void | null  -> if provided, a Cancel button is shown (used when embedded in a modal)
 */
export default function JournalVoucherForm({ voucherId = null, onSaved, onCancel }) {
  const isEditMode = Boolean(voucherId);

  const [accounts, setAccounts] = useState([]);
  const [voucherNo, setVoucherNo] = useState('');
  const [cashInHand, setCashInHand] = useState(null);
  const [date, setDate] = useState(todayIso());
  const [narration, setNarration] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [saleQty, setSaleQty] = useState('');
  const [entries, setEntries] = useState([emptyEntry()]);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Load Account Head options, and figure out the Cash in Hand balance to display.
  const loadAccounts = async () => {
    const res = await api.get('/accounts');
    setAccounts(res.data);
    const cashAccount = res.data.find((acc) =>
      (acc.accountName || '').toLowerCase().includes('cash in hand')
    );
    if (cashAccount) {
      setCashInHand((Number(cashAccount.bfDr) || 0) - (Number(cashAccount.bfCr) || 0));
    } else {
      setCashInHand(null);
    }
  };

  const loadForCreate = async () => {
    const res = await api.get('/journal-vouchers/next-voucher-no');
    setVoucherNo(res.data.voucherNo);
    setDate(todayIso());
    setNarration('');
    setPurchaseQty('');
    setSaleQty('');
    setEntries([emptyEntry()]);
  };

  const loadForEdit = async () => {
    const res = await api.get(`/journal-vouchers/${voucherId}`);
    const v = res.data;
    setVoucherNo(v.voucherNo);
    setDate(v.date ? v.date.substring(0, 10) : todayIso());
    setNarration(v.narration || '');
    setPurchaseQty(v.purchaseQty ?? '');
    setSaleQty(v.saleQty ?? '');
    setCashInHand(v.cashInHand ?? null);
    setEntries(
      (v.entries || []).map((line) => ({
        accountHead: line.accountHead?._id || line.accountHead || '',
        drAmount: line.drAmount || '',
        crAmount: line.crAmount || ''
      }))
    );
  };

  useEffect(() => {
    (async () => {
      setInitializing(true);
      setError('');
      try {
        await loadAccounts();
        if (isEditMode) {
          await loadForEdit();
        } else {
          await loadForCreate();
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load the form. Please try again.');
      } finally {
        setInitializing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voucherId]);

  const handleEntryChange = (index, field, value) => {
    setEntries((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const addRow = () => setEntries((prev) => [...prev, emptyEntry()]);

  const removeRow = (index) => {
    setEntries((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, line) => {
        acc.dr += Number(line.drAmount) || 0;
        acc.cr += Number(line.crAmount) || 0;
        return acc;
      },
      { dr: 0, cr: 0 }
    );
  }, [entries]);

  const totalsMatch = totals.dr.toFixed(2) === totals.cr.toFixed(2) && totals.dr > 0;

  const validate = () => {
    if (!date) return 'Date is required.';
    for (let i = 0; i < entries.length; i++) {
      const line = entries[i];
      if (!line.accountHead) return `Row ${i + 1}: select an Account Head.`;
      const dr = Number(line.drAmount) || 0;
      const cr = Number(line.crAmount) || 0;
      if (dr === 0 && cr === 0) return `Row ${i + 1}: enter a DR or CR amount.`;
      if (dr > 0 && cr > 0) return `Row ${i + 1}: enter only a DR amount or a CR amount, not both.`;
    }
    if (!totalsMatch) {
      return `Total DR (${totals.dr.toFixed(2)}) must equal Total CR (${totals.cr.toFixed(2)}).`;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      date,
      narration,
      purchaseQty: Number(purchaseQty) || 0,
      saleQty: Number(saleQty) || 0,
      cashInHand: cashInHand ?? 0,
      entries: entries.map((line) => ({
        accountHead: line.accountHead,
        drAmount: Number(line.drAmount) || 0,
        crAmount: Number(line.crAmount) || 0
      }))
    };

    try {
      setLoading(true);
      let res;
      if (isEditMode) {
        res = await api.put(`/journal-vouchers/${voucherId}`, payload);
      } else {
        res = await api.post('/journal-vouchers', payload);
      }

      if (onSaved) onSaved(res.data);

      if (!isEditMode) {
        setSuccessMessage(`Voucher ${res.data.voucherNo} saved.`);
        await loadForCreate();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return <p>Loading form...</p>;
  }

  return (
    <div style={styles.card}>
      <div style={styles.titleRow}>
        <h2 style={{ margin: 0 }}>{isEditMode ? 'Edit Journal Voucher' : 'Journal Voucher'}</h2>
        {!isEditMode && (
          <button
            type="button"
            style={styles.viewListButton}
            onClick={() => navigate(JOURNAL_VOUCHER_LIST_ROUTE)}
          >
            View All Vouchers
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {successMessage && <div style={styles.success}>{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        {/* Header row */}
        <div style={styles.headerRow}>
          <div style={styles.headerField}>
            <label style={styles.label}>Voucher No</label>
            <input type="text" value={voucherNo} readOnly style={{ ...styles.input, background: '#f3f4f6' }} />
          </div>

          <div style={styles.headerField}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.headerField}>
            <label style={styles.label}>Purchase Qty</label>
            <input
              type="number"
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(e.target.value)}
              placeholder="0"
              style={styles.input}
            />
          </div>

          <div style={styles.headerField}>
            <label style={styles.label}>Sale Qty</label>
            <input
              type="number"
              value={saleQty}
              onChange={(e) => setSaleQty(e.target.value)}
              placeholder="0"
              style={styles.input}
            />
          </div>

          <div style={styles.headerField}>
            <label style={styles.label}>Cash In Hand</label>
            <input
              type="text"
              readOnly
              value={cashInHand === null ? 'N/A' : cashInHand.toLocaleString()}
              style={{ ...styles.input, background: '#f3f4f6', fontWeight: 'bold' }}
            />
          </div>
        </div>

        <div style={{ ...styles.row, marginTop: 12 }}>
          <label style={styles.label}>Narration</label>
          <input
            type="text"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Brief description of this voucher"
            style={styles.input}
          />
        </div>

        {/* Entry lines */}
        <div style={{ marginTop: 18 }}>
          <div style={styles.entriesHeader}>
            <span style={{ flex: 3 }}>Account Head</span>
            <span style={{ flex: 1.5 }}>DR Amount</span>
            <span style={{ flex: 1.5 }}>CR Amount</span>
            <span style={{ width: 36 }} />
          </div>

          {entries.map((line, index) => (
            <div key={index} style={styles.entryRow}>
              <select
                style={{ ...styles.input, flex: 3 }}
                value={line.accountHead}
                onChange={(e) => handleEntryChange(index, 'accountHead', e.target.value)}
              >
                <option value="">-- Select Account Head --</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountCode} - {acc.accountName}
                  </option>
                ))}
              </select>

              <input
                type="number"
                style={{ ...styles.input, flex: 1.5 }}
                value={line.drAmount}
                onChange={(e) => handleEntryChange(index, 'drAmount', e.target.value)}
                placeholder="0"
              />

              <input
                type="number"
                style={{ ...styles.input, flex: 1.5 }}
                value={line.crAmount}
                onChange={(e) => handleEntryChange(index, 'crAmount', e.target.value)}
                placeholder="0"
              />

              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={entries.length === 1}
                style={{
                  ...styles.iconButtonDelete,
                  opacity: entries.length === 1 ? 0.4 : 1,
                  cursor: entries.length === 1 ? 'not-allowed' : 'pointer'
                }}
                title="Remove row"
              >
                <TrashIcon />
              </button>
            </div>
          ))}

          <button type="button" onClick={addRow} style={styles.addRowButton}>
            + Add Row
          </button>
        </div>

        {/* Totals */}
        <div style={styles.totalsRow}>
          <span>
            Total DR: <strong>{totals.dr.toFixed(2)}</strong>
          </span>
          <span>
            Total CR: <strong>{totals.cr.toFixed(2)}</strong>
          </span>
          <span style={{ color: totalsMatch ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
            {totalsMatch ? 'Balanced' : 'Not balanced'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? 'Saving...' : isEditMode ? 'Update Voucher' : 'Submit'}
          </button>
          {onCancel && (
            <button type="button" style={styles.cancelButton} onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const styles = {
  card: { maxWidth: 950, margin: '0 auto', fontFamily: 'Arial, sans-serif', background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 24 },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  viewListButton: { padding: '8px 16px', background: '#fff', color: '#2563eb', border: '1px solid #2563eb', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' },
  headerRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  headerField: { display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 180px' },
  row: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontWeight: 'bold', fontSize: 13 },
  input: { padding: 8, fontSize: 14, border: '1px solid #ccc', borderRadius: 4, width: '100%', boxSizing: 'border-box' },
  entriesHeader: { display: 'flex', gap: 10, fontSize: 12, fontWeight: 'bold', color: '#6b7280', padding: '0 4px', marginBottom: 6 },
  entryRow: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 },
  addRowButton: { padding: '6px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' },
  totalsRow: { display: 'flex', gap: 24, marginTop: 16, padding: '10px 14px', background: '#f9fafb', border: '1px solid #eee', borderRadius: 6, fontSize: 14 },
  submitButton: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  cancelButton: { padding: '10px 20px', background: '#fff', color: '#374151', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  iconButtonDelete: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: 4 },
  error: { background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 4, marginBottom: 12, fontSize: 14 },
  success: { background: '#dcfce7', color: '#166534', padding: 10, borderRadius: 4, marginBottom: 12, fontSize: 14 }
};