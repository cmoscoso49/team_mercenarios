import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import bannerImg  from '../../assets/banner/banner.png'
import logoImg    from '../../assets/logo/logo_mercenarios.png'
import InstagramSection from '../../components/common/InstagramSection'
import './Home.css'

const VALORES = [
  { icon: '⚔️', title: 'LEALTAD',    desc: 'El equipo siempre primero. Lo que ocurre en el campo, queda en el campo. La hermandad táctica es inquebrantable.' },
  { icon: '🎖️', title: 'DISCIPLINA', desc: 'Preparación constante, puntualidad y compromiso total con cada operativo. Sin disciplina no hay victoria.' },
  { icon: '🧠', title: 'TÁCTICA',    desc: 'Pensar antes de actuar. La estrategia colectiva marca la diferencia entre ganar y perder en el campo.' },
  { icon: '🤝', title: 'RESPETO',    desc: 'Dentro y fuera del campo. Con el equipo, con los rivales y con el deporte. El honor es nuestra marca.' },
]

const REQUISITOS = [
  'Compromiso con el equipo y entrenamientos regulares',
  'Equipamiento básico de airsoft propio',
  'Mayores de 18 años',
  'Disciplina, respeto y actitud positiva',
  'Disponibilidad para operativos y campeonatos',
  'Espíritu competitivo y trabajo en equipo',
]

export default function Home() {
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [eventos,      setEventos]      = useState([])
  const [noticias,     setNoticias]     = useState([])
  const [stats,        setStats]        = useState({ integrantes_activos: 0 })
  const [instagram,    setInstagram]    = useState([])
  const [igLoading,    setIgLoading]    = useState(true)

  // Fetch data once on mount, then refresh every 60s
  useEffect(() => {
    const cargar = () => {
      fetch('/api/v1/public/stats/')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setStats(d) })
        .catch(() => {})
      fetch('/api/v1/public/eventos/')
        .then(r => r.ok ? r.json() : [])
        .then(d => { if (Array.isArray(d)) setEventos(d) })
        .catch(() => {})
      fetch('/api/v1/public/noticias/')
        .then(r => r.ok ? r.json() : [])
        .then(d => { if (Array.isArray(d)) setNoticias(d) })
        .catch(() => {})
      fetch('/api/v1/public/instagram/')
        .then(r => r.ok ? r.json() : [])
        .then(d => { if (Array.isArray(d)) setInstagram(d) })
        .catch(() => {})
        .finally(() => setIgLoading(false))
    }
    cargar()
    const interval = setInterval(cargar, 60000)
    return () => clearInterval(interval)
  }, [])

  // Re-scan .anim elements after each data change so dynamically-rendered
  // cards (events, noticias) are observed and can receive the .visible class
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.anim:not(.visible)').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [eventos, noticias, stats])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="home">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <a href="#inicio" className="home-nav-brand">
            <img src={logoImg} alt="Team Mercenarios" className="home-nav-logo" />
            <span className="home-nav-brand-text">TEAM MERCENARIOS</span>
          </a>
          <div className={`home-nav-links ${menuOpen ? 'home-nav-open' : ''}`}>
            <a href="#nosotros" className="home-nav-link" onClick={closeMenu}>NOSOTROS</a>
            <a href="#airsoft"  className="home-nav-link" onClick={closeMenu}>AIRSOFT</a>
            <a href="#eventos"  className="home-nav-link" onClick={closeMenu}>EVENTOS</a>
            <a href="#noticias" className="home-nav-link" onClick={closeMenu}>NOTICIAS</a>
            <a href="#galeria"  className="home-nav-link" onClick={closeMenu}>GALERÍA</a>
            <Link to="/postulacion" className="home-nav-link" onClick={closeMenu}>ÚNETE</Link>
            <Link to="/login" className="home-nav-cta" onClick={closeMenu}>ACCESO MIEMBROS</Link>
          </div>
          <button className="home-nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="home-hero" id="inicio">
        <img src={bannerImg} alt="" className="home-hero-bg" />
        <div className="home-hero-overlay" />
        <div className="home-hero-scanline" />

        <div className="home-hero-cta-wrap">
          <Link to="/postulacion" className="home-btn-primary home-btn-hero">ÚNETE AL TEAM</Link>
          <Link to="/login" className="home-btn-ghost">ACCESO MIEMBROS</Link>
        </div>

        <div className="home-hero-stats">
          <div className="home-hero-stat">
            <span className="home-hero-stat-num">{stats.integrantes_activos > 0 ? `${stats.integrantes_activos}+` : '—'}</span>
            <span className="home-hero-stat-label">Integrantes Activos</span>
          </div>
          <div className="home-hero-stat-div" />
          <div className="home-hero-stat">
            <span className="home-hero-stat-num">2021</span>
            <span className="home-hero-stat-label">Año de Fundación</span>
          </div>
          <div className="home-hero-stat-div" />
          <div className="home-hero-stat">
            <span className="home-hero-stat-num">50+</span>
            <span className="home-hero-stat-label">Eventos Realizados</span>
          </div>
          <div className="home-hero-stat-div" />
          <div className="home-hero-stat">
            <span className="home-hero-stat-num">ARICA</span>
            <span className="home-hero-stat-label">Chile</span>
          </div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ───────────────────────────────────────── */}
      <section className="home-section" id="nosotros">
        <div className="home-container">

          <div className="home-section-header anim">
            <span className="home-section-tag">// QUIÉNES SOMOS</span>
            <h2 className="home-section-title">TEAM MERCENARIOS</h2>
          </div>

          <div className="home-nosotros-grid">
            <div className="home-nosotros-text anim">
              <p>
                Team Mercenarios es un equipo de airsoft fundado en 2021 en Chile. Nacimos con la misión
                de crear un espacio serio y competitivo para jugadores apasionados por la táctica, el trabajo
                en equipo y la superación constante.
              </p>
              <p>
                Desde nuestros primeros operativos hasta los campeonatos regionales, hemos construido una
                comunidad unida por el respeto, la disciplina y la pasión compartida por el airsoft táctico
                y competitivo.
              </p>
              <div className="home-nosotros-mision">
                <div className="home-mision-label">// MISIÓN</div>
                <p className="home-mision-text">
                  Ser el equipo de referencia en airsoft táctico y competitivo de Chile, formando jugadores
                  íntegros y disciplinados, comprometidos tanto dentro como fuera del campo de operaciones.
                </p>
              </div>
            </div>

            <div className="home-nosotros-nums anim" style={{ transitionDelay: '0.15s' }}>
              <div className="home-num-card">
                <span className="home-num-value">{stats.integrantes_activos > 0 ? `${stats.integrantes_activos}+` : '—'}</span>
                <span className="home-num-label">INTEGRANTES ACTIVOS</span>
              </div>
              <div className="home-num-card">
                <span className="home-num-value">4</span>
                <span className="home-num-label">AÑOS DE HISTORIA</span>
              </div>
              <div className="home-num-card">
                <span className="home-num-value">+3</span>
                <span className="home-num-label">CAMPEONATOS</span>
              </div>
              <div className="home-num-card">
                <span className="home-num-value">100%</span>
                <span className="home-num-label">TÁCTICO</span>
              </div>
            </div>
          </div>

          <div className="home-valores-grid" style={{ marginTop: 56 }}>
            {VALORES.map((v, i) => (
              <div
                key={v.title}
                className="home-valor-card anim"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <span className="home-valor-icon">{v.icon}</span>
                <h3 className="home-valor-title">{v.title}</h3>
                <p className="home-valor-desc">{v.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── QUÉ ES AIRSOFT ──────────────────────────────────────── */}
      <section className="home-section home-section-alt" id="airsoft">
        <div className="home-container">

          <div className="home-section-header anim">
            <span className="home-section-tag">// DEPORTE</span>
            <h2 className="home-section-title">¿QUÉ ES AIRSOFT?</h2>
          </div>

          <div className="home-airsoft-grid">
            <div className="home-airsoft-text anim">
              <p>
                El airsoft es un deporte táctico de simulación militar donde equipos compiten en escenarios
                reales y controlados. Los jugadores utilizan réplicas de armas que disparan proyectiles de
                plástico (BBs) de 6mm con velocidades reguladas para máxima seguridad.
              </p>
              <p>
                A diferencia de otros deportes, el airsoft exige planificación táctica, trabajo en equipo,
                disciplina y resistencia física. Combina la adrenalina del deporte de acción con la
                inteligencia estratégica del ajedrez en tiempo real.
              </p>
              <div className="home-airsoft-tag-row">
                {['DEPORTE DE ACCIÓN','TRABAJO EN EQUIPO','SIMULACIÓN TÁCTICA','EQUIPAMIENTO REAL'].map(t => (
                  <span key={t} className="home-airsoft-tag">{t}</span>
                ))}
              </div>
            </div>

            <div className="home-airsoft-features anim" style={{ transitionDelay: '0.15s' }}>
              {[
                { icon: '⚡', title: 'ALTA ADRENALINA',    desc: 'Escenarios dinámicos con objetivos reales y presión táctica constante.' },
                { icon: '🎯', title: 'TÁCTICA REAL',       desc: 'Maniobras, flanqueos y comunicación de equipo como en operaciones reales.' },
                { icon: '🛡️', title: '100% SEGURO',        desc: 'Equipamiento protector certificado y normativas estrictas de seguridad.' },
                { icon: '🤜', title: 'ESPÍRITU DE EQUIPO', desc: 'La victoria es colectiva. Se gana juntos o no se gana.' },
              ].map(f => (
                <div key={f.title} className="home-feature-item">
                  <span className="home-feature-icon">{f.icon}</span>
                  <div>
                    <strong>{f.title}</strong>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── PRÓXIMOS EVENTOS ────────────────────────────────────── */}
      <section className="home-section" id="eventos">
        <div className="home-container">

          <div className="home-section-header anim">
            <span className="home-section-tag">// OPERATIVOS</span>
            <h2 className="home-section-title">PRÓXIMOS EVENTOS</h2>
            <p className="home-section-sub">
              Calendario completo disponible en el área de miembros.
            </p>
          </div>

          <div className="home-eventos-grid">
            {eventos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center' }}>
                Próximos eventos serán anunciados pronto.
              </p>
            ) : eventos.map((ev, i) => (
              <div
                key={ev.id || i}
                className={`home-evento-card home-tipo-${ev.tipo}-card anim`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <span className={`home-evento-tipo home-tipo-${ev.tipo}`}>{ev.tipo.toUpperCase()}</span>
                <h3 className="home-evento-title">{ev.titulo}</h3>
                <div className="home-evento-meta">
                  <span>📅 {ev.fecha}</span>
                  <span>📍 {ev.lugar || 'Por confirmar'}</span>
                </div>
                <Link to={`/eventos/${ev.id}`} className="home-noticia-cta" style={{ marginTop: 12 }}>VER DETALLE →</Link>
              </div>
            ))}
          </div>

          <div className="home-section-footer anim">
            <Link to="/login" className="home-btn-outline">VER CALENDARIO COMPLETO →</Link>
          </div>

        </div>
      </section>

      {/* ── NOTICIAS ────────────────────────────────────────────── */}
      <section className="home-section home-section-alt" id="noticias">
        <div className="home-container">

          <div className="home-section-header anim">
            <span className="home-section-tag">// COMUNICACIONES</span>
            <h2 className="home-section-title">NOTICIAS DEL TEAM</h2>
            <p className="home-section-sub">
              Últimas novedades, resultados y comunicados del equipo.
            </p>
          </div>

          <div className="home-noticias-grid">
            {noticias.length > 0
              ? noticias.map((n, i) => (
                <div
                  key={n.id || i}
                  className="home-noticia-card anim"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="home-noticia-header">
                    <span className="home-noticia-cat">NOTICIA</span>
                    <span className="home-noticia-dias">{n.fecha_publicacion || ''}</span>
                  </div>
                  <h3 className="home-noticia-titulo">{n.titulo}</h3>
                  {n.resumen && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0' }}>{n.resumen}</p>}
                  <Link to={`/noticias/${n.id}`} className="home-noticia-cta">LEER COMPLETO →</Link>
                </div>
              ))
              : [
                { id: 'p1', cat: 'EQUIPO',      titulo: 'Noticias exclusivas para miembros' },
                { id: 'p2', cat: 'OPERATIVO',   titulo: 'Resultados y comunicados internos' },
                { id: 'p3', cat: 'CAMPEONATO',  titulo: 'Preparación para torneos' },
              ].map((n, i) => (
                <div
                  key={n.id}
                  className="home-noticia-card anim"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="home-noticia-header">
                    <span className="home-noticia-cat">{n.cat}</span>
                  </div>
                  <h3 className="home-noticia-titulo">{n.titulo}</h3>
                  <div className="home-noticia-lock">
                    <span>🔒</span>
                    <span>Exclusivo para miembros</span>
                  </div>
                  <Link to="/login" className="home-noticia-cta">LEER COMPLETO →</Link>
                </div>
              ))
            }
          </div>

          <div className="home-section-footer anim">
            <Link to="/login" className="home-btn-primary">VER TODAS LAS NOTICIAS</Link>
          </div>

        </div>
      </section>

      {/* ── GALERÍA ─────────────────────────────────────────────── */}
      <section className="home-section" id="galeria">
        <div className="home-container">

          <div className="home-section-header anim">
            <span className="home-section-tag">// GALERÍA</span>
            <h2 className="home-section-title">EN EL CAMPO</h2>
            <p className="home-section-sub">Momentos de nuestros operativos y campeonatos.</p>
          </div>

          <div className="home-galeria-grid">
            {[1,2,3,4,5,6].map((n, i) => (
              <div
                key={n}
                className="home-galeria-item anim"
                style={{ transitionDelay: `${i * 0.06}s` }}
              >
                <div className="home-galeria-inner">
                  <div className="home-galeria-icon">
                    <img src={logoImg} alt="" className="home-galeria-logo" />
                  </div>
                  <div className="home-galeria-overlay">
                    <span className="home-galeria-label">OP-0{n}</span>
                    <Link to="/login" className="home-galeria-ver">VER GALERÍA →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── INSTAGRAM ───────────────────────────────────────────── */}
      <section className="home-section home-section-alt ig-section" id="instagram">
        <div className="home-container">
          <InstagramSection publicaciones={instagram} loading={igLoading} />
        </div>
      </section>

      {/* ── ÚNETE ───────────────────────────────────────────────── */}
      <section className="home-unete" id="unete">
        <div className="home-unete-bg" />
        <div className="home-unete-overlay" />
        <div className="home-container" style={{ position: 'relative', zIndex: 1 }}>

          <div className="home-section-header anim" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px' }}>
            <span className="home-section-tag" style={{ textAlign: 'center' }}>// RECLUTAMIENTO</span>
            <h2 className="home-section-title" style={{ textAlign: 'center' }}>¿QUIERES UNIRTE?</h2>
            <p className="home-section-sub" style={{ maxWidth: '100%', textAlign: 'center' }}>
              Team Mercenarios siempre está buscando nuevos operativos que compartan nuestra visión,
              disciplina y pasión por el airsoft táctico y competitivo.
            </p>
          </div>

          <div className="home-unete-grid">
            <div className="home-requisitos anim">
              <div className="home-requisitos-header">
                <span className="home-section-tag">// REQUISITOS</span>
                <h3 className="home-requisitos-title">LO QUE BUSCAMOS</h3>
              </div>
              <ul className="home-requisitos-list">
                {REQUISITOS.map((r, i) => (
                  <li key={i} className="home-requisito-item">
                    <span className="home-requisito-check">◆</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="home-contacto-card anim" style={{ transitionDelay: '0.15s' }}>
              <div className="home-contacto-logo">
                <img src={logoImg} alt="Team Mercenarios" className="home-contacto-img" />
              </div>
              <h3 className="home-contacto-title">¿LISTO PARA POSTULAR?</h3>
              <p className="home-contacto-desc">
                Completa nuestro formulario de postulación. Evaluamos cada solicitud
                personalmente. Te contactaremos a la brevedad.
              </p>
              <div className="home-contacto-sep" />
              <p className="home-contacto-desc" style={{ fontSize: 13 }}>
                ¿Ya eres miembro? Accede al sistema de gestión con tus credenciales.
              </p>
              <Link to="/postulacion" className="home-btn-primary home-btn-large" style={{ marginTop: 24, display: 'inline-flex' }}>
                POSTULAR AHORA →
              </Link>
              <Link to="/login" className="home-btn-ghost" style={{ marginTop: 12, display: 'inline-flex', fontSize: '0.8rem' }}>
                ACCESO MIEMBROS
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer-inner">
            <div className="home-footer-brand">
              <img src={logoImg} alt="Team Mercenarios" className="home-footer-logo" />
              <div className="home-footer-brand-text">
                <span className="home-footer-name">TEAM MERCENARIOS</span>
                <span className="home-footer-sub">Chile · Airsoft Táctico · Est. 2021</span>
              </div>
            </div>
            <div className="home-footer-nav">
              <a href="#nosotros" className="home-footer-navlink">Nosotros</a>
              <a href="#airsoft"  className="home-footer-navlink">Airsoft</a>
              <a href="#eventos"  className="home-footer-navlink">Eventos</a>
              <a href="#galeria"  className="home-footer-navlink">Galería</a>
            </div>
            <div className="home-footer-right">
              <Link to="/postulacion" className="home-footer-cta">POSTULAR →</Link>
              <Link to="/login" className="home-footer-cta" style={{ opacity: 0.6, fontSize: '0.78rem' }}>ÁREA DE MIEMBROS →</Link>
              <p className="home-footer-copy">© 2021–2026 Team Mercenarios</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
