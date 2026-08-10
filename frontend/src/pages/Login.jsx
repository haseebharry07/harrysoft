import { useState } from 'react';
import api from '../api/axiosConfig';
import './Login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { const { data } = await api.post('/auth/login', { email, password }); onLogin(data); }
    catch (err) { setError(err.response?.data?.message || 'Unable to sign in. Please try again.'); }
    finally { setLoading(false); }
  };
  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <div className="login-brand">Accounting App</div><h1>Welcome back</h1><p>Sign in to continue to your workspace.</p>
    {error && <div className="login-error" role="alert">{error}</div>}
    <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
    <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
    <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
  </form></main>;
}
