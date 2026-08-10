import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minHeight: '100vh', background: '#f3f4f6' }}>
        <Header />
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}