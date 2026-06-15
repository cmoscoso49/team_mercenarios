import React from 'react'

const TOP = {
  green:  '#3fb950',
  red:    '#f85149',
  yellow: '#e3b341',
}

const DOT = {
  green:  '#3fb950',
  red:    '#f85149',
  yellow: '#e3b341',
}

export default function StatCard({ label, value, color, prefix = '' }) {
  const topColor = TOP[color] || 'var(--border-color)'
  const dotColor = DOT[color]

  return (
    <div className={`stat-card ${color ? `stat-card--${color}` : ''}`}
         style={{ '--top-c': topColor }}>
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
