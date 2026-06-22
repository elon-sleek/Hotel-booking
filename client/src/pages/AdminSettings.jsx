import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function AdminSettings() {
  const [form, setForm] = useState({ current_pin: '', new_pin: '', confirm_pin: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.current_pin || !form.new_pin || !form.confirm_pin) {
      return setError('All fields are required.');
    }
    if (form.new_pin.length < 4) {
      return setError('New PIN must be at least 4 characters.');
    }
    if (form.new_pin !== form.confirm_pin) {
      return setError('New PIN and confirmation do not match.');
    }

    const token = localStorage.getItem('adminToken');
    setLoading(true);
    try {
      await axios.put('/api/admin/pin',
        { current_pin: form.current_pin, new_pin: form.new_pin },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setSuccess('PIN updated successfully. Please log in again.');
      setForm({ current_pin: '', new_pin: '', confirm_pin: '' });
      setTimeout(() => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }, 2000);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
      setError(err.response?.data?.error || 'Failed to update PIN.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: '480px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Admin Settings</h1>
        <p className="page-subtitle">Change your admin login PIN</p>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="current_pin">Current PIN</label>
            <input
              id="current_pin"
              name="current_pin"
              type="password"
              placeholder="Enter current PIN"
              value={form.current_pin}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new_pin">New PIN</label>
            <input
              id="new_pin"
              name="new_pin"
              type="password"
              placeholder="At least 4 characters"
              value={form.new_pin}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm_pin">Confirm New PIN</label>
            <input
              id="confirm_pin"
              name="confirm_pin"
              type="password"
              placeholder="Repeat new PIN"
              value={form.confirm_pin}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Updating...' : 'Update PIN'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <Link to="/admin/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Back to Dashboard</Link>
      </div>
    </div>
  );
}
