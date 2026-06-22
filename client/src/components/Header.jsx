import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const token = localStorage.getItem('adminToken');

  function handleLogout() {
    localStorage.removeItem('adminToken');
    navigate('/');
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo" style={{ color: 'white', textDecoration: 'none' }}>
          <span className="logo-icon">🏠</span>
          <span>The Rock Apartment 2</span>
        </Link>
        <nav className="header-nav">
          {!isAdmin && (
            <>
              <Link to="/" className="btn-nav">Home</Link>
              <Link to="/book" className="btn-nav">Book Now</Link>
              <Link to="/admin/login" className="btn-nav">Admin</Link>
            </>
          )}
          {isAdmin && token && (
            <>
              <Link to="/admin/dashboard" className="btn-nav">Dashboard</Link>
              <Link to="/admin/settings" className="btn-nav">Settings</Link>
              <button className="btn-nav" onClick={handleLogout}>Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
