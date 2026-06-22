import { useState } from 'react';
import { Link } from 'react-router-dom';
import BookingForm from '../components/BookingForm';
import BookingCalendar from '../components/BookingCalendar';

export default function BookPage() {
  const [calKey, setCalKey] = useState(0);

  return (
    <div className="page">
      <div style={{ marginBottom: '24px' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          Back to Home
        </Link>
        <h1 className="page-title">Book Your Stay</h1>
        <p className="page-subtitle">The Rock Apartment 2 — Ota, Ogun State</p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '24px' }}>
        Check the calendar below for available dates, then fill out the booking form.
      </div>

      <BookingCalendar refreshKey={calKey} />
      <BookingForm onSuccess={() => setCalKey(k => k + 1)} />
    </div>
  );
}
