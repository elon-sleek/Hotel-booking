import { useState } from 'react';
import { Link } from 'react-router-dom';
import BookingCalendar from '../components/BookingCalendar';
import DirectionButton from '../components/DirectionButton';

export default function Home() {
  const [calKey, setCalKey] = useState(0);

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero">
        <span className="hero-tag">Ota, Ogun State, Nigeria</span>
        <h1 className="hero-title">The Rock Apartment 2</h1>
        <p className="hero-subtitle">
          A premium 5-bedroom duplex en-suite apartment offering comfort, style, and security
          in the heart of Ota, Ogun State.
        </p>
        <div className="hero-actions">
          <Link to="/book" className="btn btn-primary">Book Your Stay</Link>
          <DirectionButton />
        </div>
      </div>

      {/* Features */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">🛏️</div>
          <div className="feature-label">5 Bedrooms</div>
          <div className="feature-desc">Spacious en-suite duplex for ultimate comfort</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <div className="feature-label">Ota, Ogun State</div>
          <div className="feature-desc">Conveniently located with easy navigation</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <div className="feature-label">Secure Booking</div>
          <div className="feature-desc">ID data protected under NDPR regulations</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <div className="feature-label">Live Availability</div>
          <div className="feature-desc">Real-time calendar showing open dates</div>
        </div>
      </div>

      {/* Availability Calendar */}
      <BookingCalendar refreshKey={calKey} />

      {/* CTA */}
      <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, var(--primary-light), #dbeafe)' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>Ready to book?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>
          Select your dates on the calendar above and confirm your stay in minutes.
        </p>
        <Link to="/book" className="btn btn-primary" style={{ fontSize: '1rem', padding: '12px 32px' }}>
          Reserve Now
        </Link>
      </div>
    </div>
  );
}
