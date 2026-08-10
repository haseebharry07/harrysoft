import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CreateAccount from './pages/CreateAccount';
import JournalVoucherForm from './pages/JournalVoucherForm';
import JournalVoucherList from './pages/JournalVoucherList';
import CashReceiptVoucherForm from './pages/CashReceiptVoucherForm';
import CashReceiptVoucherList from './pages/CashReceiptVoucherList';
import CashPaymentVoucherForm from './pages/CashPaymentVoucherForm';
import CashPaymentVoucherList from './pages/CashPaymentVoucherList';

// Simple placeholder pages for now
const Dashboard = () => <h2>Dashboard</h2>;
const ChartOfAccounts = () => <h2>Chart of Accounts</h2>;
// const JournalVoucherForm = () => <h2>Journal Voucher</h2>;
const Invoices = () => <h2>Invoices</h2>;
const Customers = () => <h2>Customers</h2>;
const Reports = () => <h2>Reports</h2>;

function App() {
  return (
    <HashRouter>
      <Layout>
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
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;