import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CrosshairLogo from '../common/CrosshairLogo'
import './Sidebar.css'

const LIDERAZGO = ['admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero']

// Módulo → ruta(s) del sidebar
const MODULO_NAV = [
  { modulo: 'dashboard',     to: '/',                label: 'Dashboard',       icon: '◈', exact: true },
  { modulo: 'integrantes',   to: '/integrantes',     label: 'Integrantes',     icon: '◉' },
  { modulo: 'finanzas',      to: '/finanzas',        label: 'Finanzas',        icon: '◆' },
  { modulo: 'eventos',       to: '/eventos',         label: 'Eventos',         icon: '◎' },
  { modulo: 'eventos',       to: '/participaciones', label: 'Participaciones', icon: '◇' },
  { modulo: 'noticias',      to: '/noticias',        label: 'Noticias',        icon: '▣' },
  { modulo: 'instagram',     to: '/galeria',         label: 'Galería',         icon: '▤' },
  { modulo: 'instagram',     to: '/instagram',       label: 'Instagram',       icon: '◉' },
  { modulo: 'reportes',      to: '/reportes',        label: 'Reportes',        icon: '▦' },
  { modulo: 'reclutamiento', to: '/postulaciones',   label: 'Postulaciones',   icon: '◈' },
]

// Ítem exclusivo del admin (gestión de permisos)
const ADMIN_ONLY = [
  { to: '/permisos', label: 'Permisos', icon: '⊕' },
]

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const rol = user?.rol || ''
  const modulos = user?.modulos_acceso || []

  const navItems = MODULO_NAV.filter(item => modulos.includes(item.modulo))
  const adminItems = rol === 'admin' ? ADMIN_ONLY : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
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
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
          </NavLink>
        ))}

        {adminItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
          </NavLink>
        ))}

        {/* Mi Cuenta — todos los roles de liderazgo */}
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
