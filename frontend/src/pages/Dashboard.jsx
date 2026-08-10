import './Dashboard.css';

export default function Dashboard() {
  return <section className="dashboard-page">
    <div className="company-card">
      <div className="company-logo" aria-label="Accounting App logo">AA</div>
      <div>
        <p className="welcome">Welcome to</p>
        <h1>Accounting App</h1>
        <p className="company-description">Manage your vouchers, ledgers, reports, and financial balances in one place.</p>
      </div>
    </div>
  </section>;
}
