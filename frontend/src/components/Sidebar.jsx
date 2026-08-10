import { NavLink } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Create Account', path: '/create-account' },
  { label: 'Journal Voucher', path: '/journal-voucher' },
  { label: 'Cash Receipt Voucher', path: '/cash-receipt-vouchers' },
  { label: 'Cash Payment Voucher', path: '/cash-payment-vouchers' },
  { label: 'All Vouchers', path: '/all-vouchers' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'Customers', path: '/customers' },
  { label: 'Reports', path: '/reports' },
];

export default function Sidebar() {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>Accounting App</div>
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.link,
              background: isActive ? '#2563eb' : 'transparent',
              color: isActive ? '#fff' : '#374151',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 230,
    minHeight: '100vh',
    background: '#f9fafb',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
  },
  logo: {
    padding: '20px 16px',
    fontSize: 18,
    fontWeight: 'bold',
    borderBottom: '1px solid #e5e7eb',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    gap: 4,
  },
  link: {
    padding: '10px 12px',
    borderRadius: 6,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
  },
};
