import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getDashboard } from '../../api/reportes'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import '../../components/common/common.css'
import './Dashboard.css'

const ROLES_LIDERAZGO   = ['admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero']
const ROLES_PORTAL_ONLY = ['player']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const tieneAccesoFinanciero = ROLES_LIDERAZGO.includes(user?.rol)

  if (ROLES_PORTAL_ONLY.includes(user?.rol)) {
    return <Navigate to="/portal" replace />
  }

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data))
      .catch(() => setError('Error al cargar dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Cargando dashboard...</div>
  if (error) return <div className="error-msg">{error}</div>
  if (!data) return null

  return (
    <div className="dashboard">
      {tieneAccesoFinanciero ? (
        <>
          <div className="grid-stats">
            <StatCard label="Saldo Actual" value={data.saldo_actual} prefix="$" color="green" />
            <StatCard label="Ingresos del Mes" value={data.ingresos_mes} prefix="$" color="green" />
            <StatCard label="Egresos del Mes" value={data.egresos_mes} prefix="$" color="red" />
            <StatCard label="Deudas Pendientes" value={data.deudas_total} prefix="$" color="yellow" />
            <StatCard label="Integrantes Activos" value={data.integrantes_activos} color="green" />
            <StatCard label="Integrantes Inactivos" value={data.integrantes_inactivos} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, marginTop: 4 }}>
            Cuotas 2024–2025
          </div>
          <div className="grid-stats" style={{ marginBottom: 0 }}>
            <StatCard label="Al día" value={data.integrantes_al_dia ?? '—'} color="green" />
            <StatCard label="Con deuda" value={data.integrantes_con_deuda ?? '—'} color="red" />
            <StatCard label="Deuda total cuotas" value={data.deuda_mensualidades ?? 0} prefix="$" color="yellow" />
          </div>
        </>
      ) : (
        <div className="grid-stats">
          <StatCard label="Integrantes Activos" value={data.integrantes_activos} color="green" />
          <StatCard label="Integrantes Inactivos" value={data.integrantes_inactivos} />
          <StatCard label="Al día en cuotas" value={data.integrantes_al_dia ?? '—'} color="green" />
          <StatCard label="Con deuda" value={data.integrantes_con_deuda ?? '—'} color="red" />
        </div>
      )}

      {!tieneAccesoFinanciero && (
        <div style={{ padding: '10px 14px', marginBottom: 16, background: 'rgba(74,124,74,0.1)', border: '1px solid rgba(74,124,74,0.3)', borderRadius: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
          No tienes permisos para ver la informacion financiera del Team.
        </div>
      )}

      <div className="dashboard-grid">
        {tieneAccesoFinanciero && (
        <div className="card">
          <h3 className="dashboard-section-title">Ultimos Movimientos</h3>
          {data.ultimos_movimientos?.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ultimos_movimientos.map((m) => (
                    <tr key={m.id}>
                      <td>{m.fecha}</td>
                      <td><Badge value={m.tipo} label={m.tipo_display} /></td>
                      <td style={{ color: m.tipo === 'ingreso' ? 'var(--accent-light)' : 'var(--danger)', fontWeight: 600 }}>
                        ${Number(m.monto).toLocaleString('es-CL')}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.descripcion?.slice(0, 50)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Sin movimientos registrados</div>
          )}
          <div style={{ marginTop: 12 }}>
            <Link to="/finanzas" className="btn btn-secondary btn-sm">Ver todos</Link>
          </div>
        </div>
        )}

        <div className="dashboard-side">
          <div className="card">
            <h3 className="dashboard-section-title">Próximos Eventos</h3>
            {data.proximos_eventos?.length > 0 ? (
              <ul className="dashboard-list">
                {data.proximos_eventos.map((e) => (
                  <li key={e.id} className="dashboard-list-item">
                    <div className="dashboard-event-date">{e.fecha}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{e.titulo}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{e.lugar}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">Sin eventos próximos</div>
            )}
            <Link to="/eventos" className="btn btn-secondary btn-sm" style={{ marginTop: 12, display: 'inline-block' }}>Ver calendario</Link>
          </div>

          <div className="card">
            <h3 className="dashboard-section-title">Últimas Noticias</h3>
            {data.ultimas_noticias?.length > 0 ? (
              <ul className="dashboard-list">
                {data.ultimas_noticias.map((n) => (
                  <li key={n.id} className="dashboard-list-item" style={{ flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{n.titulo}</div>
                    {n.resumen && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {n.resumen.slice(0, 90)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">Sin noticias publicadas</div>
            )}
            <Link to="/noticias" className="btn btn-secondary btn-sm" style={{ marginTop: 12, display: 'inline-block' }}>Ver noticias</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
