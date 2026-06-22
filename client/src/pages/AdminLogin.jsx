import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!pin) return setError('Please enter your PIN.');
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/login', { pin });
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
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
            <label htmlFor="pin">Admin PIN</label>
            <input
              id="pin"
              type="password"
              className="pin-input"
              placeholder="• • • •"
              value={pin}
              onChange={e => { setPin(e.target.value); setError(''); }}
              maxLength={20}
              autoFocus
              required
            />
            <p className="hint" style={{ textAlign: 'center' }}>Default PIN: 1234 — change after first login</p>
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
