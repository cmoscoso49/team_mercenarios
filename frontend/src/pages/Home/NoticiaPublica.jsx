import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import logoImg from '../../assets/logo/logo_mercenarios.png'
import './Publica.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export default function NoticiaPublica() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [noticia, setNoticia] = useState(null)
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/public/noticias/${id}/`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(d => { setNoticia(d); setCargando(false) })
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
          <button className="pub-nav-back" onClick={() => navigate('/inicio#noticias')}>
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
            <p>Noticia no encontrada o no disponible públicamente.</p>
            <Link to="/inicio" className="pub-btn">← VOLVER AL INICIO</Link>
          </div>
        )}

        {noticia && (
          <article className="pub-article">
            <div className="pub-meta-top">
              <span className="pub-tag">// NOTICIA</span>
              <span className="pub-fecha">{noticia.fecha_publicacion}</span>
            </div>

            <h1 className="pub-titulo">{noticia.titulo}</h1>

            {noticia.resumen && (
              <p className="pub-resumen">{noticia.resumen}</p>
            )}

            {noticia.imagen && (
              <div className="pub-imagen-wrap">
                <img src={noticia.imagen} alt={noticia.titulo} className="pub-imagen" />
              </div>
            )}

            <div className="pub-contenido">
              {noticia.contenido
                ? noticia.contenido.split('\n').map((line, i) =>
                    line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                  )
                : <p className="pub-sin-contenido">Contenido completo disponible para miembros.</p>
              }
            </div>

            <div className="pub-footer-nav">
              <Link to="/inicio#noticias" className="pub-btn">← VOLVER A NOTICIAS</Link>
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
