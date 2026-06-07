import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getIntegrante, getMensualidadesIntegrante,
  getParticipacionesIntegrante, getDeudasIntegrante, getResumenIntegrante
} from '../../api/integrantes'
import client from '../../api/client'
import Badge from '../../components/common/Badge'
import '../../components/common/common.css'

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function IntegranteFicha() {
  const { id } = useParams()
  const [tab, setTab] = useState('mensualidades')
  const [integrante, setIntegrante] = useState(null)
  const [mensualidades, setMensualidades] = useState([])
  const [participaciones, setParticipaciones] = useState([])
  const [deudas, setDeudas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getIntegrante(id),
      getMensualidadesIntegrante(id),
      getParticipacionesIntegrante(id),
      getDeudasIntegrante(id),
      getResumenIntegrante(id),
    ]).then(([ig, ms, ps, ds, rs]) => {
      setIntegrante(ig.data)
      setMensualidades(ms.data.results || ms.data)
      setParticipaciones(ps.data.results || ps.data)
      setDeudas(ds.data.results || ds.data)
      setResumen(rs.data)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading">Cargando ficha...</div>
  if (!integrante) return <div className="error-msg">Integrante no encontrado</div>

  const anioActual = new Date().getFullYear()
  const mensActual = mensualidades.filter(m => m.anio === anioActual)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/integrantes" style={{ color: 'var(--text-muted)', fontSize: 12 }}>← Integrantes</Link>
          <h2 className="page-title">
            {integrante.nick ? <><span style={{ color: 'var(--accent-light)' }}>{integrante.nick}</span> — </> : ''}
            {integrante.nombre}
          </h2>
        </div>
        <Link to={`/integrantes/${id}/editar`} className="btn btn-secondary">Editar</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 10px' }}>
                👤
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{integrante.nombre}</div>
              {integrante.nick && <div style={{ color: 'var(--accent-light)', fontSize: 13 }}>{integrante.nick}</div>}
              <div style={{ marginTop: 8 }}><Badge value={integrante.estado} /></div>
            </div>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              {[
                ['RUT', integrante.rut],
                ['Rol', integrante.rol],
                ['Teléfono', integrante.telefono],
                ['Email', integrante.email],
                ['Talla', integrante.talla_polera],
                ['Ingreso', integrante.fecha_ingreso],
              ].map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>{k}</dt>
                  <dd style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{v}</dd>
                </div>
              ) : null)}
            </dl>
          </div>
          {resumen && (
            <div className="card">
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Resumen {anioActual}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mensualidades pagadas</span>
                  <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{resumen.mensualidades_pagadas_anio}/12</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Participaciones</span>
                  <span style={{ fontWeight: 700 }}>{resumen.total_participaciones}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Deuda pendiente</span>
                  <span style={{ color: resumen.deudas_pendientes > 0 ? 'var(--danger)' : 'var(--accent-light)', fontWeight: 700 }}>
                    ${Number(resumen.deudas_pendientes).toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="tabs">
            {[['mensualidades', 'Mensualidades'], ['participaciones', 'Participaciones'], ['deudas', 'Deudas'], ['reincorporacion', 'Reincorporacion']].map(([k, l]) => (
              <button key={k} className={`tab ${tab === k ? 'tab-active' : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === 'mensualidades' && (
            <div className="card">
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                Mensualidades {anioActual}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                  const m = mensActual.find(x => x.mes === mes)
                  const estado = m?.estado || 'pendiente'
                  return (
                    <div key={mes} style={{
                      padding: '10px 8px', borderRadius: 4, textAlign: 'center',
                      background: estado === 'pagada' ? 'rgba(61,122,61,0.22)' : estado === 'exento' ? 'rgba(150,150,150,0.10)' : 'rgba(204,34,34,0.14)',
                      border: `1px solid ${estado === 'pagada' ? 'rgba(61,122,61,0.45)' : estado === 'exento' ? 'rgba(150,150,150,0.22)' : 'rgba(204,34,34,0.35)'}`,
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{MESES[mes]}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: estado === 'pagada' ? 'var(--accent-light)' : estado === 'exento' ? 'var(--text-muted)' : 'var(--danger)' }}>
                        {estado === 'pagada' ? '✓' : estado === 'exento' ? '—' : '✕'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'participaciones' && (
            <div className="card" style={{ padding: 0 }}>
              {participaciones.length === 0 ? (
                <div className="empty-state">Sin participaciones registradas</div>
              ) : (
                <table>
                  <thead><tr><th>Evento</th><th>Fecha</th><th>Asistió</th></tr></thead>
                  <tbody>
                    {participaciones.map(p => (
                      <tr key={p.id}>
                        <td>{p.evento_titulo}</td>
                        <td>{p.evento_fecha}</td>
                        <td><Badge value={p.asistio ? 'activo' : 'inactivo'} label={p.asistio ? 'Sí' : 'No'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'deudas' && (
            <div className="card" style={{ padding: 0 }}>
              {deudas.length === 0 ? (
                <div className="empty-state">Sin deudas registradas</div>
              ) : (
                <table>
                  <thead><tr><th>Descripcion</th><th>Total</th><th>Pagado</th><th>Pendiente</th><th>Estado</th></tr></thead>
                  <tbody>
                    {deudas.map(d => (
                      <tr key={d.id}>
                        <td>{d.descripcion}</td>
                        <td>${Number(d.monto_total).toLocaleString('es-CL')}</td>
                        <td>${Number(d.monto_pagado).toLocaleString('es-CL')}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>${Number(d.monto_pendiente).toLocaleString('es-CL')}</td>
                        <td><Badge value={d.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'reincorporacion' && (
            <ReincorporacionTab id={id} integrante={integrante} />
          )}
        </div>
      </div>
    </div>
  )
}

function ReincorporacionTab({ id, integrante }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [obs, setObs] = useState('')
  const [generado, setGenerado] = useState(false)

  useEffect(() => {
    client.get(`/integrantes/${id}/reincorporacion/`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [id])

  const fmt = v => v !== null && v !== undefined ? `$${Number(v).toLocaleString('es-CL')}` : '—'

  const handleGenerar = () => {
    if (!window.confirm(`Generar plan de reincorporacion para ${data.nombre}?`)) return
    setGenerado(true)
    alert(`Plan generado:\n${data.cuotas_pendientes} cuotas x ${fmt(data.valor_cuota_actual)} = ${fmt(data.monto_total_reincorporacion)}\n\nObservaciones: ${obs || 'Sin observaciones'}`)
  }

  if (loading) return <div className="loading">Calculando...</div>
  if (!data) return null

  const puede = data.puede_reincorporarse
  const estadoColor = puede ? '#d4a017' : '#9e9e9e'

  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
        Seccion Reincorporacion
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Estado actual</div>
          <div style={{ marginTop: 4 }}><Badge value={data.estado_actual} /></div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ultimo pago registrado</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: data.ultimo_pago_registrado ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {data.ultimo_pago_registrado || 'Sin pagos previos'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cuotas pendientes</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: data.cuotas_pendientes > 0 ? '#e74c3c' : '#6abf6a' }}>
            {data.cuotas_pendientes}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Valor cuota actual</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--text-primary)' }}>
            {fmt(data.valor_cuota_actual)}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', background: 'rgba(74,124,74,0.1)', border: '1px solid rgba(74,124,74,0.3)', borderRadius: 4, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total requerido para reincorporacion</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: data.cuotas_pendientes > 0 ? '#e74c3c' : '#6abf6a' }}>
          {fmt(data.monto_total_reincorporacion)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{data.observaciones}</div>
      </div>

      {puede && (
        <div>
          <div className="form-group">
            <label className="form-label">Observaciones del plan</label>
            <textarea className="form-control" rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Ej: Se condona cuota de enero 2025, paga desde febrero..." />
          </div>
          <button className="btn btn-primary" onClick={handleGenerar} disabled={generado}>
            {generado ? 'Plan generado' : 'Generar plan de reincorporacion'}
          </button>
        </div>
      )}

      {!puede && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Este integrante ({data.estado_actual}) no requiere plan de reincorporacion en este momento.
        </div>
      )}
    </div>
  )
}
