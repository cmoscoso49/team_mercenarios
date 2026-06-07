import React, { useEffect, useState } from 'react'
import { getReporteFinanciero, getReporteIntegrantes, getReporteParticipaciones, getReporteConciliacion } from '../../api/reportes'
import Badge from '../../components/common/Badge'
import '../../components/common/common.css'
import './Reportes.css'

const MESES_CORTOS = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function ReporteFinanciero({ anio }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getReporteFinanciero({ anio }).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [anio])
  if (loading) return <div className="loading">Cargando...</div>
  if (!data) return null

  const maxBar = Math.max(...data.ingresos_por_mes.map(m => m.total), ...data.egresos_por_mes.map(m => m.total), 1)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="dashboard-section-title">Ingresos vs Egresos por Mes</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {data.ingresos_por_mes.map((m, i) => {
              const ing = m.total
              const eg = data.egresos_por_mes[i].total
              return (
                <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 90, gap: 2 }}>
                    <div style={{ height: `${(eg / maxBar) * 80}px`, background: 'rgba(204,34,34,0.55)', borderRadius: '2px 2px 0 0', minHeight: eg > 0 ? 2 : 0 }} />
                    <div style={{ height: `${(ing / maxBar) * 80}px`, background: 'rgba(61,122,61,0.65)', borderRadius: '2px 2px 0 0', minHeight: ing > 0 ? 2 : 0 }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{MESES_CORTOS[m.mes]}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11 }}>
            <span style={{ color: 'var(--accent-light)' }}>■ Ingresos</span>
            <span style={{ color: 'var(--danger)' }}>■ Egresos</span>
          </div>
        </div>
        <div className="card">
          <div className="dashboard-section-title">Gastos por Categoría</div>
          {data.gastos_por_categoria.slice(0, 6).map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{c.categoria__nombre || 'Sin categoría'}</span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>${Number(c.total).toLocaleString('es-CL')}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="dashboard-section-title">Mensualidades Pendientes {anio}</div>
        {data.mensualidades_pendientes.length === 0 ? (
          <div className="empty-state">Sin mensualidades pendientes</div>
        ) : (
          <table>
            <thead><tr><th>Integrante</th><th>Nick</th><th>Mes</th></tr></thead>
            <tbody>
              {data.mensualidades_pendientes.map((m, i) => (
                <tr key={i}>
                  <td>{m.integrante__nombre}</td>
                  <td style={{ color: 'var(--accent-light)' }}>{m.integrante__nick}</td>
                  <td>{MESES_CORTOS[m.mes]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ReporteIntegrantes({ anio }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getReporteIntegrantes({ anio }).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [anio])
  if (loading) return <div className="loading">Cargando...</div>
  if (!data) return null

  return (
    <div>
      <div className="grid-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card"><span className="stat-card-label">Activos</span><span className="stat-card-value green">{data.total_activos}</span></div>
        <div className="stat-card"><span className="stat-card-label">Inactivos</span><span className="stat-card-value red">{data.total_inactivos}</span></div>
        <div className="stat-card"><span className="stat-card-label">Postulantes</span><span className="stat-card-value yellow">{data.total_postulantes}</span></div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Nick</th><th>Nombre</th><th>Estado</th><th>Mensual. Pagadas</th><th>Mensual. Pend.</th><th>Deuda</th><th>Participaciones</th></tr></thead>
          <tbody>
            {data.integrantes.map(i => (
              <tr key={i.id}>
                <td style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{i.nick || '—'}</td>
                <td>{i.nombre}</td>
                <td><Badge value={i.estado} /></td>
                <td style={{ textAlign: 'center', color: 'var(--accent-light)', fontWeight: 700 }}>{i.mensualidades_pagadas}</td>
                <td style={{ textAlign: 'center', color: i.mensualidades_pendientes > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{i.mensualidades_pendientes}</td>
                <td style={{ color: i.deuda_total > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: i.deuda_total > 0 ? 700 : 400 }}>
                  {i.deuda_total > 0 ? `$${Number(i.deuda_total).toLocaleString('es-CL')}` : '—'}
                </td>
                <td style={{ textAlign: 'center' }}>{i.total_participaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReporteParticipaciones({ anio }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getReporteParticipaciones({ anio }).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [anio])
  if (loading) return <div className="loading">Cargando...</div>
  if (!data) return null

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <span style={{ color: 'var(--text-muted)' }}>Eventos realizados en {anio}: </span>
        <strong style={{ color: 'var(--accent-light)' }}>{data.total_eventos_realizados}</strong>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Nick</th><th>Nombre</th><th>Asistencias</th><th>Total Eventos</th><th>% Asistencia</th></tr></thead>
          <tbody>
            {data.participaciones.map(p => (
              <tr key={p.id}>
                <td style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{p.nick || '—'}</td>
                <td>{p.nombre}</td>
                <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.asistencias}</td>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{p.total_eventos}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${p.porcentaje_asistencia}%`, height: '100%', background: p.porcentaje_asistencia >= 70 ? 'var(--accent-primary)' : 'var(--warning)', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.porcentaje_asistencia >= 70 ? 'var(--accent-light)' : 'var(--warning)', minWidth: 38 }}>{p.porcentaje_asistencia}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Reportes() {
  const [tab, setTab] = useState('financiero')
  const [anio, setAnio] = useState(new Date().getFullYear())

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Reportes</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Año:</label>
          <input className="form-control" type="number" value={anio} onChange={e => setAnio(Number(e.target.value))} style={{ width: 90 }} />
        </div>
      </div>

      <div className="tabs">
        {[['financiero', 'Financiero'], ['integrantes', 'Integrantes'], ['participaciones', 'Participaciones'], ['conciliacion', 'Conciliacion Excel']].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? 'tab-active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'financiero' && <ReporteFinanciero anio={anio} />}
      {tab === 'integrantes' && <ReporteIntegrantes anio={anio} />}
      {tab === 'participaciones' && <ReporteParticipaciones anio={anio} />}
      {tab === 'conciliacion' && <ReporteConciliacion />}
    </div>
  )
}

function ReporteConciliacion() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getReporteConciliacion().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Cargando...</div>
  if (!data) return null

  const fmt = v => v !== null && v !== undefined ? `$${Number(v).toLocaleString('es-CL')}` : '—'
  const estadoColor = data.estado === 'cuadrado' ? '#52a852' : '#cc2222'
  const estadoLabel = data.estado === 'cuadrado' ? 'CUADRADO' : 'DIFERENCIA DETECTADA'

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, borderColor: estadoColor }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>ESTADO CONCILIACION</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: estadoColor }}>{estadoLabel}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 16 }}>
          {[
            ['Saldo Excel (real)', data.saldo_excel, 'var(--accent-light)'],
            ['Saldo Sistema (importado)', data.saldo_sistema, data.saldo_sistema < 0 ? 'var(--danger)' : 'var(--accent-light)'],
            ['Diferencia', data.diferencia, Math.abs(data.diferencia) < 1 ? 'var(--accent-light)' : 'var(--danger)'],
          ].map(([label, val, color]) => (
            <div key={label} className="stat-card">
              <span className="stat-card-label">{label}</span>
              <span className="stat-card-value" style={{ fontSize: 20, color }}>{fmt(val)}</span>
            </div>
          ))}
        </div>
      </div>

      {data.detalle_excel && (
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Detalle formula Excel: {data.detalle_excel.formula}
          </div>
          <table>
            <thead><tr><th>Componente</th><th>Celda Excel</th><th>Valor</th></tr></thead>
            <tbody>
              {[
                ['Caja chica + MS 2022', 'H.CONTABLE!P7', data.detalle_excel.hcontable_caja_chica_ms2022],
                ['Donaciones e ingresos', 'H.CONTABLE!P10', data.detalle_excel.hcontable_donaciones],
                ['Total gastos (negativo)', 'H.CONTABLE!P13', -data.detalle_excel.hcontable_gastos],
                ['Efectivo extra', 'H.CONTABLE!L47', data.detalle_excel.hcontable_extras],
                ['Mensualidades 2023', 'MENSUALIDADES 2023!S34', data.detalle_excel.mensualidades_2023],
                ['Rifa total', 'RIFA!N36', data.detalle_excel.rifa],
                ['Mensualidades 2024', 'MENSUALIDADES 2024!S41', data.detalle_excel.mensualidades_2024],
                ['Mensualidades 2025', 'MENSUALIDADES 2025!S35', data.detalle_excel.mensualidades_2025],
              ].map(([label, celda, val]) => (
                <tr key={celda}>
                  <td>{label}</td>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>{celda}</td>
                  <td style={{ fontWeight: 700, color: Number(val) < 0 ? 'var(--danger)' : 'var(--accent-light)' }}>{fmt(val)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--accent-primary)' }}>
                <td style={{ fontWeight: 700 }}>SALDO REAL EXCEL</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>= P7+P10-P13+L47+...</td>
                <td style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: 16 }}>{fmt(data.saldo_excel)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            Ultima importacion: {data.detalle_excel.fecha_importacion?.split('T')[0]}
          </div>
        </div>
      )}
    </div>
  )
}
