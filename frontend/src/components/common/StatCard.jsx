import React from 'react'

const ACCENT = {
  green:  'var(--accent-light)',
  red:    'var(--danger)',
  yellow: 'var(--accent-gold)',
}

const DOT = {
  green:  '#4ade80',
  red:    '#f87171',
  yellow: '#fbbf24',
}

export default function StatCard({ label, value, color, prefix = '' }) {
  const accentColor = ACCENT[color] || '#2a2a2a'
  const dotColor    = DOT[color]

  return (
    <div className={`stat-card stat-card--hud ${color ? `stat-card--${color}` : ''}`}
         style={{ '--hud-accent': accentColor }}>
      <div className="stat-card-top-bar" />
      <div className="stat-card-label-row">
        {dotColor && <span className="stat-card-dot" style={{ background: dotColor }} />}
        <span className="stat-card-label">{label}</span>
      </div>
      <span className={`stat-card-value ${color || ''}`}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('es-CL') : (value ?? '—')}
      </span>
    </div>
  )
}
