import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CrosshairLogo from '../common/CrosshairLogo'
import './Sidebar.css'

const ALL_NAV = [
  { to: '/',               label: 'Dashboard',       icon: '◈', exact: true,  roles: ['administrador','tesorero','capitan','integrante','readonly'] },
  { to: '/integrantes',    label: 'Integrantes',      icon: '◉',               roles: ['administrador','tesorero','capitan'] },
  { to: '/finanzas',       label: 'Finanzas',         icon: '◆',               roles: ['administrador','tesorero'] },
  { to: '/eventos',        label: 'Eventos',          icon: '◎',               roles: ['administrador','tesorero','capitan','integrante','readonly'] },
  { to: '/participaciones',label: 'Participaciones',  icon: '◇',               roles: ['administrador','tesorero','capitan','integrante'] },
  { to: '/noticias',       label: 'Noticias',         icon: '▣',               roles: ['administrador','tesorero','capitan','integrante','readonly'] },
  { to: '/galeria',        label: 'Galería',          icon: '▤',               roles: ['administrador','tesorero','capitan','integrante','readonly'] },
  { to: '/reportes',       label: 'Reportes',         icon: '▦',               roles: ['administrador','tesorero'] },
]

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const rol = user?.rol || 'readonly'
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
