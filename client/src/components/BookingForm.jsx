import { useState } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';

const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const dayAfter = format(addDays(new Date(), 2), 'yyyy-MM-dd');

export default function BookingForm({ onSuccess }) {
  const [form, setForm] = useState({
    guest_name: '',
    check_in: tomorrow,
    check_out: dayAfter,
  });
  const [idFile, setIdFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function handleFile(file) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WEBP image or PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB.');
      return;
    }
    setIdFile(file);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.guest_name.trim()) return setError('Please enter your full name.');
    if (!idFile) return setError('Please upload a valid ID image.');
    if (!form.check_in || !form.check_out) return setError('Please select check-in and check-out dates.');
    if (new Date(form.check_out) <= new Date(form.check_in)) return setError('Check-out must be after check-in.');

    const data = new FormData();
    data.append('guest_name', form.guest_name.trim());
    data.append('check_in', form.check_in);
    data.append('check_out', form.check_out);
    data.append('id_image', idFile);

    setLoading(true);
    try {
      const res = await axios.post('/api/bookings', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(`✅ ${res.data.message} Booking reference: ${res.data.booking_id.slice(0, 8).toUpperCase()}`);
      setForm({ guest_name: '', check_in: tomorrow, check_out: dayAfter });
      setIdFile(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const numDays = form.check_in && form.check_out
    ? Math.ceil((new Date(form.check_out) - new Date(form.check_in)) / 86400000)
    : 0;

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>🛎️ Book Your Stay</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
        Your ID information is protected under Nigerian Data Protection Regulation (NDPR).
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!success && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="guest_name">Full Name *</label>
            <input
              id="guest_name"
              name="guest_name"
              type="text"
              placeholder="e.g. Adeyemi Johnson"
              value={form.guest_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="booking-form-grid">
            <div className="form-group">
              <label htmlFor="check_in">Check-In Date *</label>
              <input
                id="check_in"
                name="check_in"
                type="date"
                value={form.check_in}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="check_out">Check-Out Date *</label>
              <input
                id="check_out"
                name="check_out"
                type="date"
                value={form.check_out}
                min={form.check_in || format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {numDays > 0 && (
            <div className="alert alert-info" style={{ marginBottom: '16px' }}>
              📆 Duration: <strong>{numDays} night{numDays !== 1 ? 's' : ''}</strong>
            </div>
          )}

          <div className="form-group">
            <label>Government-Issued ID (Photo or PDF) *</label>
            <div
              className={`file-upload-area${dragOver ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={e => handleFile(e.target.files[0])}
              />
              <div className="file-upload-icon">🪪</div>
              <div className="file-upload-text">
                {idFile ? (
                  <span className="file-upload-name">✅ {idFile.name}</span>
                ) : (
                  <>Drag & drop or click to upload<br /><span style={{ fontSize: '0.75rem' }}>NIN, Int'l Passport, Driver's Licence · Max 5 MB</span></>
                )}
              </div>
            </div>
            <div className="hint">🔒 Your ID is encrypted and only accessible to the apartment admin under NDPR.</div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? <><span className="spinner" /> Processing…</> : '✅ Confirm Booking'}
          </button>
        </form>
      )}

      {success && (
        <button
          className="btn btn-outline"
          style={{ marginTop: '12px', width: '100%' }}
          onClick={() => { setSuccess(''); setError(''); }}
        >
          Make Another Booking
        </button>
      )}
    </div>
  );
}
