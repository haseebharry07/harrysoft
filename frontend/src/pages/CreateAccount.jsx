import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const headGroups = ['Expense', 'Income', 'Sales', 'Purchase','Debtors', 'Creditors', 'Bank', 'Cash', 'Fixed Assets', 'Current Assets', 'Current Liabilities', 'Capital'];
const expenseGroups = [
  'Main Expenses',
  'Running Expenses',
  'Other Expenses'
];

const emptyForm = {
  accountName: '',
  accountCode: '',
  bfDr: '',
  bfCr: '',
  headGroup: '',
  expenseGroup: '',
  bfDate: ''
};

// Small inline icon components so we don't need an extra icon library.
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

export default function CreateAccount() {
  const [formData, setFormData] = useState(emptyForm);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating, otherwise editing this account's _id

  const fetchAccounts = async () => {
    try {
      setListLoading(true);
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (acc) => {
    setEditingId(acc._id);
    setFormData({
      accountName: acc.accountName || '',
      accountCode: acc.accountCode || '',
      bfDr: acc.bfDr ?? '',
      bfCr: acc.bfCr ?? '',
      headGroup: acc.headGroup || '',
      expenseGroup: acc.expenseGroup || '',
      bfDate: acc.bfDate ? acc.bfDate.substring(0, 10) : ''
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.accountName || !formData.accountCode || !formData.bfDate) {
      setError('Please fill Account Name, Account Code and BF Date.');
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await api.put(`/accounts/${editingId}`, formData);
      } else {
        await api.post('/accounts', formData);
      }

      closeForm();
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (acc) => {
    const confirmed = window.confirm(`Delete account "${acc.accountName}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/accounts/${acc._id}`);
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={styles.headerRow}>
        <h2 style={{ margin: 0 }}>Accounts</h2>
        <button type="button" style={styles.createButton} onClick={openCreateForm}>
          + Create Account
        </button>
      </div>

      {listLoading ? (
        <p>Loading accounts...</p>
      ) : accounts.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>BF DR</th>
              <th style={styles.th}>BF CR</th>
              <th style={styles.th}>Head Group</th>
              <th style={styles.th}>Expense Group</th>
              <th style={styles.th}>BF Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc._id}>
                <td style={styles.td}>{acc.accountName}</td>
                <td style={styles.td}>{acc.accountCode}</td>
                <td style={styles.td}>{acc.bfDr}</td>
                <td style={styles.td}>{acc.bfCr}</td>
                <td style={styles.td}>{acc.headGroup}</td>
                <td style={styles.td}>{acc.expenseGroup}</td>
                <td style={styles.td}>
                  {acc.bfDate ? new Date(acc.bfDate).toLocaleDateString() : ''}
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={styles.iconButtonEdit}
                      title="Edit account"
                      onClick={() => openEditForm(acc)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      style={styles.iconButtonDelete}
                      title="Delete account"
                      onClick={() => handleDelete(acc)}
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
        <div style={styles.emptyState}>
          No accounts yet. Click "Create Account" to add your first one.
        </div>
      )}

      {showForm && (
        <div style={styles.overlay} onClick={closeForm}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Account' : 'Create Account'}</h3>
              <button type="button" style={styles.closeButton} onClick={closeForm} aria-label="Close">
                &times;
              </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.row}>
                <label style={styles.label}>Account Name *</label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <label style={styles.label}>Account Code *</label>
                <input
                  type="text"
                  name="accountCode"
                  value={formData.accountCode}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <label style={styles.label}>BF DR</label>
                <input
                  type="number"
                  name="bfDr"
                  value={formData.bfDr}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <label style={styles.label}>BF CR</label>
                <input
                  type="number"
                  name="bfCr"
                  value={formData.bfCr}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <label style={styles.label}>Head Group</label>
                <select
                  name="headGroup"
                  value={formData.headGroup}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">-- Select Head Group --</option>
                  {headGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div style={styles.row}>
                <label style={styles.label}>Expense Group</label>
                <select
                  name="expenseGroup"
                  value={formData.expenseGroup}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">-- Select Expense Group --</option>
                  {expenseGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div style={styles.row}>
                <label style={styles.label}>BF Date *</label>
                <input
                  type="date"
                  name="bfDate"
                  value={formData.bfDate}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" style={styles.button} disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Update' : 'Submit'}
                </button>
                <button type="button" style={styles.cancelButton} onClick={closeForm} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  createButton: { padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontWeight: 'bold', fontSize: 14 },
  input: { padding: 8, fontSize: 14, border: '1px solid #ccc', borderRadius: 4 },
  button: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  cancelButton: { padding: '10px 20px', background: '#fff', color: '#374151', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: { border: '1px solid #ddd', padding: 8, background: '#f3f4f6', textAlign: 'left', fontSize: 13 },
  td: { border: '1px solid #ddd', padding: 8, fontSize: 13 },
  error: { background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 4, marginBottom: 12, fontSize: 14 },
  emptyState: { padding: 30, textAlign: 'center', color: '#6b7280', border: '1px dashed #ccc', borderRadius: 8, background: '#fafafa' },
  iconButtonEdit: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, border: '1px solid #93c5fd', background: '#eff6ff', color: '#2563eb', borderRadius: 4, cursor: 'pointer' },
  iconButtonDelete: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: 4, cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 60, zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 8, padding: 24, width: '100%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  closeButton: { background: 'none', border: 'none', fontSize: 24, lineHeight: 1, cursor: 'pointer', color: '#6b7280' }
};