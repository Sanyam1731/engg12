import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import CompareBar from './CompareBar';

const navItems = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
      </svg>
    ),
  },
  {
    to: '/explorer',
    label: 'Explorer',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    to: '/predictor',
    label: 'Predictor',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    to: '/preferences',
    label: 'Preferences',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function Layout() {
  const { user, logout, prefs, compareList } = useApp();
  const nav = useNavigate();
  const loc = useLocation();

  function onLogout() {
    logout();
    nav('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="hdr-brand" onClick={() => nav('/dashboard')}>
          <div className="hdr-logo">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="hdr-text">
            <div className="hdr-title">Mr.ADDMISSION-WALA</div>
            <div className="hdr-sub">CAP 1–4 · 2025-26 · MHT-CET + JEE</div>
          </div>
        </div>
        <nav className="top-nav">
          {navItems.map(it => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => 'top-nav-link' + (isActive ? ' on' : '')}
            >
              {it.icon}
              <span>{it.label}</span>
              {it.to === '/preferences' && prefs.length > 0 && (
                <span className="nav-badge">{prefs.length}</span>
              )}
              {it.to === '/compare' && compareList.length > 0 && (
                <span className="nav-badge">{compareList.length}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="hdr-user">
          {user ? (
            <>
              <span className="hdr-user-name" title={user.email}>
                {user.name?.split(' ')[0] || user.email}
              </span>
              <button className="btn-ghost" onClick={onLogout} title="Logout">
                <svg viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </>
          ) : (
            <button className="btn-primary btn-sm" onClick={() => nav('/login')}>
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="app-main" key={loc.pathname}>
        <div className="page-fade">
          <Outlet />
        </div>
      </main>

      <CompareBar />

      <nav className="bottom-nav">
        {navItems.map(it => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => 'bottom-nav-link' + (isActive ? ' on' : '')}
          >
            <span className="bn-icon">{it.icon}</span>
            <span className="bn-label">{it.label}</span>
            {it.to === '/preferences' && prefs.length > 0 && (
              <span className="nav-badge bn-badge">{prefs.length}</span>
            )}
            {it.to === '/compare' && compareList.length > 0 && (
              <span className="nav-badge bn-badge">{compareList.length}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
