import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PortalLayout.css';

const ROLES_LIDERAZGO = ['admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero'];

const NAV_LINKS = [
  { to: '/portal',                  label: 'Inicio',      end: true },
  { to: '/portal/mis-cuotas',       label: 'Mis Cuotas' },
  { to: '/portal/mis-eventos',      label: 'Mis Eventos' },
  { to: '/portal/mi-perfil',        label: 'Mi Perfil' },
  { to: '/portal/mis-pagos',        label: 'Mis Pagos' },
  { to: '/portal/cambiar-password', label: 'Contraseña' },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const esLiderazgo = ROLES_LIDERAZGO.includes(user?.rol);

  useEffect(() => { setMenuOpen(false) }, [location]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="portal-wrap">
      <nav className="portal-nav">
        <div className="portal-nav-inner">
          {esLiderazgo ? (
            <Link to="/" className="portal-nav-brand" style={{ textDecoration: 'none' }}>
              ← Panel
            </Link>
          ) : (
            <span className="portal-nav-brand">Team Mercenarios</span>
          )}

          <div className={`portal-nav-links${menuOpen ? ' portal-nav-links-open' : ''}`}>
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `portal-nav-link${isActive ? ' active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
            <div className="portal-nav-user portal-nav-user-mobile">
              <span className="portal-nav-nick">{user?.username}</span>
              <span className="portal-nav-rol">{user?.rol}</span>
            </div>
            <button className="portal-nav-logout portal-nav-logout-mobile" onClick={handleLogout}>Salir</button>
          </div>

          <div className="portal-nav-right">
            <div className="portal-nav-user">
              <span className="portal-nav-nick">{user?.username}</span>
              <span className="portal-nav-rol">{user?.rol}</span>
            </div>
            <button className="portal-nav-logout" onClick={handleLogout}>Salir</button>
            <button
              className={`portal-nav-hamburger${menuOpen ? ' portal-nav-hamburger-open' : ''}`}
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Menú"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="portal-nav-backdrop" onClick={() => setMenuOpen(false)} />
        )}
      </nav>

      <main className="portal-main">
        <Outlet />
      </main>

      <footer className="portal-footer">
        © {new Date().getFullYear()} Team Mercenarios — Portal del Integrante
      </footer>
    </div>
  );
}
