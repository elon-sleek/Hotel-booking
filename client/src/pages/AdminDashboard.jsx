import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return { Authorization: 'Bearer ' + token };
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const adminUsername = localStorage.getItem('adminUsername') || '';
  const adminRole = localStorage.getItem('adminRole') || '';
  const roleLabel = adminRole === 'super_admin' ? 'Super Admin' : 'Extra Admin';
  const roleBadgeClass = adminRole === 'super_admin' ? 'badge-green' : 'badge-blue';

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/admin/bookings', { headers: authHeaders() });
      setBookings(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminUsername');
        navigate('/admin/login');
      } else {
        setError('Failed to load bookings.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleDelete(id) {
    if (!window.confirm('Cancel this booking and delete the guest ID? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await axios.delete('/api/admin/bookings/' + id, { headers: authHeaders() });
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  function viewId(id) {
    const token = encodeURIComponent(localStorage.getItem('adminToken') || '');
    window.open('/api/admin/bookings/' + id + '/id-image?token=' + token, '_blank');
  }

  const today = new Date();
  const activeBookings = bookings.filter(b => new Date(b.check_out) >= today);
  const totalNights = bookings.reduce((s, b) => s + b.num_days, 0);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <p className="page-subtitle" style={{ margin: 0 }}>The Rock Apartment 2 — All Bookings</p>
            {adminUsername && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                · <strong>{adminUsername}</strong>
                <span className={'badge ' + roleBadgeClass}>{roleLabel}</span>
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/settings" className="btn btn-outline" style={{ fontSize: '0.875rem' }}>Settings</Link>
          <button className="btn btn-primary" onClick={fetchBookings} style={{ fontSize: '0.875rem' }}>Refresh</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{activeBookings.length}</div>
          <div className="stat-label">Active / Upcoming</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-value">{totalNights}</div>
          <div className="stat-label">Total Nights Booked</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div className="spinner" style={{ borderColor: 'rgba(74,144,217,0.3)', borderTopColor: 'var(--primary)', width: '36px', height: '36px', borderWidth: '4px' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛏️</div>
          <div className="empty-state-text">No bookings yet. Share the app with guests!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Guest Name</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Nights</th>
                <th>Booked On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => {
                const isActive = new Date(b.check_out) >= today;
                const isOngoing = new Date(b.check_in) <= today && new Date(b.check_out) > today;
                const statusLabel = isOngoing ? 'Ongoing' : isActive ? 'Upcoming' : 'Past';
                const statusClass = isOngoing ? 'badge-blue' : isActive ? 'badge-green' : 'badge-red';

                return (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{b.guest_name}</td>
                    <td>{format(parseISO(b.check_in), 'dd MMM yyyy')}</td>
                    <td>{format(parseISO(b.check_out), 'dd MMM yyyy')}</td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-blue">{b.num_days}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {format(new Date(b.created_at), 'dd MMM yyyy')}
                    </td>
                    <td><span className={'badge ' + statusClass}>{statusLabel}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                          onClick={() => viewId(b.id)}
                          title="View ID"
                        >
                          View ID
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleDelete(b.id)}
                          disabled={deletingId === b.id}
                          title="Cancel booking"
                        >
                          {deletingId === b.id ? '...' : 'Cancel'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Back to Home</Link>
      </div>
    </div>
  );
}
