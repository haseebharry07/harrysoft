export default function Header() {
  return (
    <div style={styles.header}>
      <div style={styles.title}>Dashboard</div>
      <div style={styles.right}>
        <span style={styles.user}>👤 Admin</span>
      </div>
    </div>
  );
}

const styles = {
  header: {
    height: 60,
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    fontFamily: 'Arial, sans-serif',
    background: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  user: {
    fontSize: 14,
    color: '#374151',
  },
};