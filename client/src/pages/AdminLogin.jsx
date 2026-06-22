import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Decode JWT payload for display purposes only (role badge, username in UI).
// No authorization decisions are made client-side; the server always re-validates the token.
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', pin: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.username) return setError('Please enter your username.');
    if (!form.pin) return setError('Please enter your PIN.');
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/login', { username: form.username, pin: form.pin });
      const token = res.data.token;
      if (typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error('Invalid login response from server.');
      }
      const payload = decodeJwt(token);
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminRole', payload.role || '');
      localStorage.setItem('adminUsername', payload.username || '');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🔐</div>
        <h1 className="login-title">Admin Portal</h1>
        <p className="login-subtitle">The Rock Apartment 2</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pin">PIN</label>
            <input
              id="pin"
              name="pin"
              type="password"
              className="pin-input"
              placeholder="• • • •"
              value={form.pin}
              onChange={handleChange}
              maxLength={20}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? <><span className="spinner" /> Verifying…</> : '🔓 Login'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
