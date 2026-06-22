import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return { Authorization: 'Bearer ' + token };
}

export default function AdminSettings() {
  const [pinForm, setPinForm] = useState({ current_pin: '', new_pin: '', confirm_pin: '' });
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const [extraAdmin, setExtraAdmin] = useState(undefined); // undefined = loading, null = none
  const [extraForm, setExtraForm] = useState({ username: '', pin: '', confirm_pin: '' });
  const [extraError, setExtraError] = useState('');
  const [extraSuccess, setExtraSuccess] = useState('');
  const [extraLoading, setExtraLoading] = useState(false);
  const [terminateLoading, setTerminateLoading] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);

  const navigate = useNavigate();
  const isSuperAdmin = localStorage.getItem('adminRole') === 'super_admin';

  const fetchExtraAdmin = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await axios.get('/api/admin/extra', { headers: authHeaders() });
      setExtraAdmin(res.data); // null if none exists
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminUsername');
        navigate('/admin/login');
      }
      setExtraAdmin(null);
    }
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    fetchExtraAdmin();
  }, [fetchExtraAdmin]);

  // ── PIN change ──────────────────────────────────────────────
  function handlePinChange(e) {
    setPinForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPinError('');
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!pinForm.current_pin || !pinForm.new_pin || !pinForm.confirm_pin) {
      return setPinError('All fields are required.');
    }
    if (pinForm.new_pin.length < 6) {
      return setPinError('New PIN must be at least 6 characters.');
    }
    if (pinForm.new_pin !== pinForm.confirm_pin) {
      return setPinError('New PIN and confirmation do not match.');
    }

    setPinLoading(true);
    try {
      await axios.put('/api/admin/pin',
        { current_pin: pinForm.current_pin, new_pin: pinForm.new_pin },
        { headers: authHeaders() }
      );
      setPinSuccess('PIN updated successfully. Please log in again.');
      setPinForm({ current_pin: '', new_pin: '', confirm_pin: '' });
      setTimeout(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminUsername');
        navigate('/admin/login');
      }, 2000);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminUsername');
        navigate('/admin/login');
      }
      setPinError(err.response?.data?.error || 'Failed to update PIN.');
    } finally {
      setPinLoading(false);
    }
  }

  // ── Extra admin management ───────────────────────────────────
  function handleExtraChange(e) {
    setExtraForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setExtraError('');
  }

  async function handleExtraSubmit(e) {
    e.preventDefault();
    setExtraError('');
    setExtraSuccess('');

    if (!extraForm.username || !extraForm.pin || !extraForm.confirm_pin) {
      return setExtraError('All fields are required.');
    }
    if (extraForm.pin.length < 6) {
      return setExtraError('PIN must be at least 6 characters.');
    }
    if (extraForm.pin !== extraForm.confirm_pin) {
      return setExtraError('PIN and confirmation do not match.');
    }

    setExtraLoading(true);
    try {
      await axios.post('/api/admin/extra',
        { username: extraForm.username, pin: extraForm.pin },
        { headers: authHeaders() }
      );
      setExtraSuccess(extraAdmin ? 'Extra admin updated.' : 'Extra admin created.');
      setExtraForm({ username: '', pin: '', confirm_pin: '' });
      setShowExtraForm(false);
      await fetchExtraAdmin();
    } catch (err) {
      setExtraError(err.response?.data?.error || 'Failed to save extra admin.');
    } finally {
      setExtraLoading(false);
    }
  }

  async function handleTerminate() {
    if (!window.confirm('Terminate extra admin access? They will not be able to log in until re-enabled.')) return;
    setTerminateLoading(true);
    setExtraError('');
    setExtraSuccess('');
    try {
      await axios.delete('/api/admin/extra', { headers: authHeaders() });
      setExtraSuccess('Extra admin access terminated.');
      await fetchExtraAdmin();
    } catch (err) {
      setExtraError(err.response?.data?.error || 'Failed to terminate extra admin.');
    } finally {
      setTerminateLoading(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: '520px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Admin Settings</h1>
        <p className="page-subtitle">Manage your PIN and admin access</p>
      </div>

      {/* PIN change */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Change PIN</h2>
        {pinError && <div className="alert alert-error">{pinError}</div>}
        {pinSuccess && <div className="alert alert-success">{pinSuccess}</div>}

        <form onSubmit={handlePinSubmit}>
          <div className="form-group">
            <label htmlFor="current_pin">Current PIN</label>
            <input
              id="current_pin"
              name="current_pin"
              type="password"
              placeholder="Enter current PIN"
              value={pinForm.current_pin}
              onChange={handlePinChange}
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
              placeholder="At least 6 characters"
              value={pinForm.new_pin}
              onChange={handlePinChange}
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
              value={pinForm.confirm_pin}
              onChange={handlePinChange}
              autoComplete="new-password"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={pinLoading} style={{ width: '100%' }}>
            {pinLoading ? 'Updating...' : 'Update PIN'}
          </button>
        </form>
      </div>

      {/* Extra admin management — super admin only */}
      {isSuperAdmin && (
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Extra Admin Management</h2>

          {extraError && <div className="alert alert-error">{extraError}</div>}
          {extraSuccess && <div className="alert alert-success">{extraSuccess}</div>}

          {extraAdmin === undefined ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</p>
          ) : extraAdmin === null || (!extraAdmin.username) ? (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                No extra admin yet.
              </p>
              {!showExtraForm ? (
                <button className="btn btn-primary" onClick={() => setShowExtraForm(true)} style={{ width: '100%' }}>
                  + Create Extra Admin
                </button>
              ) : (
                <ExtraAdminForm
                  form={extraForm}
                  onChange={handleExtraChange}
                  onSubmit={handleExtraSubmit}
                  loading={extraLoading}
                  submitLabel="Create Extra Admin"
                  onCancel={() => { setShowExtraForm(false); setExtraForm({ username: '', pin: '', confirm_pin: '' }); setExtraError(''); }}
                />
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-card, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border, #e2e8f0)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{extraAdmin.username}</span>
                    <span style={{ marginLeft: '10px' }}>
                      {extraAdmin.active
                        ? <span className="badge badge-green">Active</span>
                        : <span className="badge badge-red">Terminated</span>}
                    </span>
                  </div>
                </div>
              </div>

              {!showExtraForm ? (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => { setShowExtraForm(true); setExtraError(''); setExtraSuccess(''); }}
                    style={{ flex: 1 }}
                  >
                    {extraAdmin.active ? 'Reset Credentials' : 'Re-enable Admin'}
                  </button>
                  {extraAdmin.active && (
                    <button
                      className="btn btn-danger"
                      onClick={handleTerminate}
                      disabled={terminateLoading}
                      style={{ flex: 1 }}
                    >
                      {terminateLoading ? 'Terminating...' : 'Terminate Access'}
                    </button>
                  )}
                </div>
              ) : (
                <ExtraAdminForm
                  form={extraForm}
                  onChange={handleExtraChange}
                  onSubmit={handleExtraSubmit}
                  loading={extraLoading}
                  submitLabel={extraAdmin.active ? 'Update Extra Admin' : 'Re-enable & Set Credentials'}
                  onCancel={() => { setShowExtraForm(false); setExtraForm({ username: '', pin: '', confirm_pin: '' }); setExtraError(''); }}
                />
              )}
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: '16px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <Link to="/admin/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Back to Dashboard</Link>
      </div>
    </div>
  );
}

function ExtraAdminForm({ form, onChange, onSubmit, loading, submitLabel, onCancel }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="extra_username">Username</label>
        <input
          id="extra_username"
          name="username"
          type="text"
          placeholder="Enter username"
          value={form.username}
          onChange={onChange}
          autoComplete="off"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="extra_pin">PIN</label>
        <input
          id="extra_pin"
          name="pin"
          type="password"
          placeholder="At least 6 characters"
          value={form.pin}
          onChange={onChange}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="extra_confirm_pin">Confirm PIN</label>
        <input
          id="extra_confirm_pin"
          name="confirm_pin"
          type="password"
          placeholder="Repeat PIN"
          value={form.confirm_pin}
          onChange={onChange}
          autoComplete="new-password"
          required
        />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
          {loading ? 'Saving...' : submitLabel}
        </button>
        <button className="btn btn-outline" type="button" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
