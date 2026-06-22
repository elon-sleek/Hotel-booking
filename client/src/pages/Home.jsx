import { useState } from 'react';
import { Link } from 'react-router-dom';
import BookingCalendar from '../components/BookingCalendar';
import DirectionButton from '../components/DirectionButton';

const GALLERY = [
  {
    src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&h=480&fit=crop&q=75',
    label: 'Spacious Living Area',
    main: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=220&fit=crop&q=75',
    label: 'Master Bedroom',
  },
  {
    src: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=75',
    label: 'Fully Equipped Kitchen',
  },
  {
    src: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=220&fit=crop&q=75',
    label: 'En-Suite Bathroom',
  },
];

const AMENITIES = [
  { icon: '📶', label: 'Free Wi-Fi' },
  { icon: '❄️', label: 'Air Conditioning' },
  { icon: '🍳', label: 'Fully Fitted Kitchen' },
  { icon: '🅿️', label: 'Free Parking' },
  { icon: '🔒', label: '24/7 Security' },
  { icon: '🛁', label: 'En-Suite Bathrooms' },
  { icon: '📺', label: 'Smart TV' },
  { icon: '🛋️', label: 'Furnished Lounge' },
  { icon: '🔌', label: 'Backup Generator' },
  { icon: '🌿', label: 'Garden Area' },
];

export default function Home() {
  const [calKey, setCalKey] = useState(0);

  return (
    <div className="home-wrapper">

      {/* ── Hero Banner ── */}
      <section className="hero-banner">
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-location-badge">📍 Ota, Ogun State, Nigeria</span>
          <h1 className="hero-display-title">The Rock Apartment 2</h1>
          <p className="hero-display-sub">
            A premium 5-bedroom duplex en-suite apartment — comfort, style, and security in one address.
          </p>
          <div className="hero-pill-row">
            <span className="hero-pill">🛏️ 5 Bedrooms</span>
            <span className="hero-pill">⭐ Premium Duplex</span>
            <span className="hero-pill">🔒 NDPR Compliant</span>
          </div>
          <div className="hero-cta-row">
            <Link to="/book" className="btn btn-accent btn-lg">🛎️ Book Your Stay</Link>
          </div>
        </div>
      </section>

      <div className="page">

        {/* ── Photo Gallery ── */}
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">📸 Photo Gallery</h2>
            <span className="badge badge-blue">5-Bedroom Duplex</span>
          </div>
          <div className="gallery-grid">
            {GALLERY.map((img, i) => (
              <div key={i} className={`gallery-item${img.main ? ' gallery-main' : ''}`}>
                <img src={img.src} alt={img.label} loading="lazy" />
                <span className="gallery-label">{img.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Key Features ── */}
        <div className="feature-grid home-section">
          <div className="feature-card">
            <div className="feature-icon">🛏️</div>
            <div className="feature-label">5 En-Suite Bedrooms</div>
            <div className="feature-desc">Each bedroom has its own private bathroom and wardrobe space.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <div className="feature-label">Prime Location</div>
            <div className="feature-desc">Conveniently accessible from major roads in Ota, Ogun State.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-label">Safe & Secure</div>
            <div className="feature-desc">Gated compound with 24/7 security. Guest data protected under NDPR.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <div className="feature-label">Instant Booking</div>
            <div className="feature-desc">Book in minutes with a live availability calendar and instant confirmation.</div>
          </div>
        </div>

        {/* ── Amenities ── */}
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">✅ What's Included</h2>
          </div>
          <div className="amenities-grid">
            {AMENITIES.map((a, i) => (
              <div key={i} className="amenity-item">
                <span className="amenity-icon">{a.icon}</span>
                <span className="amenity-label">{a.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── How to Find Us ── */}
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">🗺️ How to Find Us</h2>
          </div>
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>The Rock Apartment 2</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ota, Ogun State, Nigeria</p>
            </div>
            <DirectionButton />
          </div>
        </section>

        {/* ── Availability Calendar ── */}
        <BookingCalendar refreshKey={calKey} />

        {/* ── CTA ── */}
        <div className="cta-banner home-section">
          <div className="cta-icon">🏠</div>
          <h2 className="cta-title">Ready to make a reservation?</h2>
          <p className="cta-sub">
            Check the calendar for available dates, then complete your booking in minutes.
            Your information is kept safe under NDPR regulations.
          </p>
          <Link to="/book" className="btn btn-accent btn-lg">Reserve Your Stay</Link>
        </div>

        {/* ── Footer ── */}
        <footer className="footer">
          <p>© {new Date().getFullYear()} The Rock Apartment 2 &bull; Ota, Ogun State, Nigeria</p>
          <p style={{ marginTop: '6px' }}>
            <Link to="/admin/login" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Admin Portal</Link>
          </p>
        </footer>

      </div>
    </div>
  );
}

