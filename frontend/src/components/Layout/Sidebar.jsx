import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CrosshairLogo from '../common/CrosshairLogo'
import './Sidebar.css'

const LIDERAZGO = ['admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero']

const ALL_NAV = [
  { to: '/',                label: 'Dashboard',      icon: '◈', exact: true, roles: LIDERAZGO },
  { to: '/integrantes',     label: 'Integrantes',    icon: '◉',              roles: LIDERAZGO },
  { to: '/finanzas',        label: 'Finanzas',       icon: '◆',              roles: LIDERAZGO },
  { to: '/eventos',         label: 'Eventos',        icon: '◎',              roles: LIDERAZGO },
  { to: '/participaciones', label: 'Participaciones',icon: '◇',              roles: LIDERAZGO },
  { to: '/noticias',        label: 'Noticias',       icon: '▣',              roles: LIDERAZGO },
  { to: '/galeria',         label: 'Galería',        icon: '▤',              roles: LIDERAZGO },
  { to: '/reportes',        label: 'Reportes',       icon: '▦',              roles: LIDERAZGO },
  { to: '/postulaciones',   label: 'Postulaciones',  icon: '◈',              roles: ['admin'] },
]

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const rol = user?.rol || ''
  const navItems = ALL_NAV.filter(item => item.roles.includes(rol))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <NavLink to="/" end className="sidebar-brand" title="Ir al inicio">
        <CrosshairLogo size={26} className="sidebar-logo-svg" />
        {!collapsed && <span className="sidebar-title">MERCENARIOS</span>}
      </NavLink>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
          </NavLink>
        ))}

        {/* Mi Cuenta — acceso al portal personal para todos los roles de liderazgo */}
        {LIDERAZGO.includes(rol) && (
          <Link
            to="/portal"
            className="sidebar-link sidebar-link-portal"
            title={collapsed ? 'Mi Cuenta' : undefined}
          >
            <span className="sidebar-icon">▽</span>
            {!collapsed && <span className="sidebar-label">Mi Cuenta</span>}
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && user && (
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user.username}</span>
            <span className="sidebar-user-rol">{user.rol}</span>
          </div>
        )}
        <button className="sidebar-logout" onClick={handleLogout} title="Cerrar sesión">
          <span className="sidebar-logout-icon">⏻</span>
          {!collapsed && <span>SALIR</span>}
        </button>
      </div>
    </aside>
  )
}
