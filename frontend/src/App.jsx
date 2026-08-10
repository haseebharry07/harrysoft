import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CreateAccount from './pages/CreateAccount';
import JournalVoucherForm from './pages/JournalVoucherForm';
import JournalVoucherList from './pages/JournalVoucherList';
import CashReceiptVoucherForm from './pages/CashReceiptVoucherForm';
import CashReceiptVoucherList from './pages/CashReceiptVoucherList';
import CashPaymentVoucherForm from './pages/CashPaymentVoucherForm';
import CashPaymentVoucherList from './pages/CashPaymentVoucherList';
import Login from './pages/Login';

// Simple placeholder pages for now
const Dashboard = () => <h2>Dashboard</h2>;
const ChartOfAccounts = () => <h2>Chart of Accounts</h2>;
// const JournalVoucherForm = () => <h2>Journal Voucher</h2>;
const Invoices = () => <h2>Invoices</h2>;
const Customers = () => <h2>Customers</h2>;
const Reports = () => <h2>Reports</h2>;

function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('authSession') || 'null'));
  const logout = () => { localStorage.removeItem('authSession'); setSession(null); };
  useEffect(() => {
    if (!session) return undefined;
    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) { logout(); return undefined; }
    const timer = setTimeout(logout, remaining);
    return () => clearTimeout(timer);
  }, [session]);
  if (!session || session.expiresAt <= Date.now()) {
    return <HashRouter><Routes><Route path="*" element={<Login onLogin={(data) => { localStorage.setItem('authSession', JSON.stringify(data)); setSession(data); }} />} /></Routes></HashRouter>;
  }
  return (
    <HashRouter>
      <Layout user={session.user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/accounts" element={<ChartOfAccounts />} />
          <Route path="/journal-voucher" element={<JournalVoucherForm />} />
          <Route path="/journal-vouchers" element={<JournalVoucherList />} />
          <Route path="/cash-receipt-vouchers" element={<CashReceiptVoucherForm />} />
          <Route path="/cash-receipt-vouchers/list" element={<CashReceiptVoucherList />} />  
          <Route path="/cash-payment-vouchers" element={<CashPaymentVoucherForm />} />
          <Route path="/cash-payment-vouchers/list" element={<CashPaymentVoucherList />} />     
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
