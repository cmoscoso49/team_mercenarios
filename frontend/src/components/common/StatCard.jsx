import React from 'react'

export default function StatCard({ label, value, color, prefix = '' }) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span className={`stat-card-value ${color || ''}`}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('es-CL') : (value ?? '—')}
      </span>
    </div>
  )
}
