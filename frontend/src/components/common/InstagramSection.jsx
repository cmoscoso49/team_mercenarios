import React, { useEffect, useState } from 'react'
import './Instagram.css'

const HANDLE = '@team_mercenarios_arica'
const IG_URL = 'https://instagram.com/team_mercenarios_arica'

export default function InstagramSection({ publicaciones = [], loading = false }) {
  const hayPublicaciones = publicaciones.length > 0

  return (
    <div className="ig-header-wrap">
      <div className="ig-header">
        <div className="ig-icon">☷</div>
        <div className="ig-handle">{HANDLE}</div>
        <h2 className="ig-title">Síguenos en Instagram</h2>
        <p className="ig-sub">Fotos de nuestros operativos, campeonatos y vida del team.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 }}>
          Cargando publicaciones...
        </div>
      ) : hayPublicaciones ? (
        <div className="ig-grid">
          {publicaciones.map(p => (
            <a
              key={p.id}
              className="ig-card"
              href={p.url_publicacion || IG_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={p.titulo}
            >
              {p.imagen ? (
                <img src={p.imagen} alt={p.titulo} className="ig-card-img" />
              ) : (
                <div className="ig-card-placeholder">📷</div>
              )}
              <div className="ig-card-overlay">
                <div className="ig-card-title">{p.titulo}</div>
                {p.texto && <div className="ig-card-texto">{p.texto}</div>}
              </div>
              {p.destacado && <span className="ig-card-badge">★ Dest.</span>}
            </a>
          ))}
        </div>
      ) : (
        <div className="ig-cta-empty">
          <div className="ig-cta-empty-icon">📸</div>
          <div className="ig-cta-empty-text">
            Seguinos en Instagram para ver nuestros últimos operativos y campeonatos.
          </div>
          <a className="ig-btn" href={IG_URL} target="_blank" rel="noopener noreferrer">
            Ver Instagram {HANDLE}
          </a>
        </div>
      )}

      {hayPublicaciones && (
        <div className="ig-footer">
          <a className="ig-btn" href={IG_URL} target="_blank" rel="noopener noreferrer">
            Ver Instagram {HANDLE}
          </a>
        </div>
      )}
    </div>
  )
}
