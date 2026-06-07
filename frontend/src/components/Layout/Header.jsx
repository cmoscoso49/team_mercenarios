import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CrosshairLogo from '../common/CrosshairLogo'
import './Header.css'

const titles = {
  '/':               'Dashboard',
  '/integrantes':    'Integrantes',
  '/finanzas':       'Finanzas',
  '/eventos':        'Eventos',
  '/participaciones':'Participaciones',
  '/noticias':       'Noticias',
  '/galeria':        'Galería',
  '/reportes':       'Reportes',
}

const ROL_LABELS = {
  administrador: 'ADMIN',
  tesorero:      'TESORERO',
  capitan:       'CAPITÁN',
  integrante:    'INTEGRANTE',
  readonly:      'READONLY',
}

export default function Header({ onToggleSidebar }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const base = '/' + (pathname.split('/')[1] || '')
  const title = titles[base] || 'Team Mercenarios'

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-toggle" onClick={onToggleSidebar} title="Colapsar menú">
          <span className="header-toggle-icon">☰</span>
        </button>
        <div className="header-title-wrap">
          <span className="header-title-slash">//</span>
          <h1 className="header-title">{title.toUpperCase()}</h1>
        </div>
      </div>
      <div className="header-right">
        {user && (
          <div className="header-user">
            <CrosshairLogo size={16} color="#3d7a3d" dotColor="#cc2222" />
            <span className="header-user-name">{user.username}</span>
            <span className="header-user-rol">{ROL_LABELS[user.rol] || user.rol}</span>
          </div>
        )}
      </div>
    </header>
  )
}
