import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import logoImg from '../../assets/logo/logo_mercenarios.png'
import './Publica.css'

const TIPO_LABELS = {
  entrenamiento: 'ENTRENAMIENTO',
  partida:       'PARTIDA',
  campeonato:    'CAMPEONATO',
  reunion:       'REUNIÓN',
  actividad:     'ACTIVIDAD',
  externo:       'EVENTO EXTERNO',
}

const ESTADO_LABELS = {
  programado: 'PRÓXIMO',
  realizado:  'REALIZADO',
  cancelado:  'CANCELADO',
}

export default function EventoPublico() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [error, setError]   = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/public/eventos/${id}/`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(d => { setEvento(d); setCargando(false) })
      .catch(() => { setError(true); setCargando(false) })
  }, [id])

  return (
    <div className="pub-page">
      <nav className="pub-nav">
        <div className="pub-nav-inner">
          <Link to="/inicio" className="pub-nav-brand">
            <img src={logoImg} alt="Team Mercenarios" className="pub-nav-logo" />
            <span className="pub-nav-brand-text">TEAM MERCENARIOS</span>
          </Link>
          <button className="pub-nav-back" onClick={() => navigate('/inicio#eventos')}>
            ← VOLVER
          </button>
        </div>
      </nav>

      <main className="pub-main">
        {cargando && (
          <div className="pub-loading">CARGANDO...</div>
        )}

        {error && (
          <div className="pub-error">
            <p>Evento no encontrado.</p>
            <Link to="/inicio" className="pub-btn">← VOLVER AL INICIO</Link>
          </div>
        )}

        {evento && (
          <article className="pub-article">
            <div className="pub-meta-top">
              <span className="pub-tag">// {TIPO_LABELS[evento.tipo] || 'EVENTO'}</span>
              <span className={`pub-estado pub-estado-${evento.estado}`}>
                {ESTADO_LABELS[evento.estado] || evento.estado_display}
              </span>
            </div>

            <h1 className="pub-titulo">{evento.titulo}</h1>

            <div className="pub-evento-meta">
              <div className="pub-meta-item">
                <span className="pub-meta-label">FECHA</span>
                <span className="pub-meta-value">📅 {evento.fecha}</span>
              </div>
              {evento.hora && (
                <div className="pub-meta-item">
                  <span className="pub-meta-label">HORA</span>
                  <span className="pub-meta-value">🕐 {evento.hora}</span>
                </div>
              )}
              {evento.lugar && (
                <div className="pub-meta-item">
                  <span className="pub-meta-label">LUGAR</span>
                  <span className="pub-meta-value">📍 {evento.lugar}</span>
                </div>
              )}
            </div>

            {evento.imagen_destacada && (
              <div className="pub-imagen-wrap">
                <img src={evento.imagen_destacada} alt={evento.titulo} className="pub-imagen" />
              </div>
            )}

            {evento.descripcion && (
              <div className="pub-contenido">
                {evento.descripcion.split('\n').map((line, i) =>
                  line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                )}
              </div>
            )}

            <div className="pub-footer-nav">
              <Link to="/inicio#eventos" className="pub-btn">← VOLVER A EVENTOS</Link>
              <Link to="/login" className="pub-btn-primary">ACCESO MIEMBROS →</Link>
            </div>
          </article>
        )}
      </main>

      <footer className="pub-footer">
        <span>© 2021–2026 Team Mercenarios · Chile</span>
      </footer>
    </div>
  )
}
