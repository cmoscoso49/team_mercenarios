import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PortalLayout.css';

const ROLES_LIDERAZGO = ['admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero'];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const esLiderazgo = ROLES_LIDERAZGO.includes(user?.rol);

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

          <NavLink to="/portal" end className={({ isActive }) => `portal-nav-link${isActive ? ' active' : ''}`}>
            Inicio
          </NavLink>
          <NavLink to="/portal/mis-cuotas" className={({ isActive }) => `portal-nav-link${isActive ? ' active' : ''}`}>
            Mis Cuotas
          </NavLink>
          <NavLink to="/portal/mis-eventos" className={({ isActive }) => `portal-nav-link${isActive ? ' active' : ''}`}>
            Mis Eventos
          </NavLink>
          <NavLink to="/portal/mi-perfil" className={({ isActive }) => `portal-nav-link${isActive ? ' active' : ''}`}>
            Mi Perfil
          </NavLink>

          <div className="portal-nav-user">
            <span className="portal-nav-nick">{user?.username}</span>
            <span className="portal-nav-rol">{user?.rol}</span>
          </div>
          <button className="portal-nav-logout" onClick={handleLogout}>Salir</button>
        </div>
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
