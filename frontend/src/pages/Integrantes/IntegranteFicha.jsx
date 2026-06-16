import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getIntegrante, getMensualidadesIntegrante,
  getParticipacionesIntegrante, getDeudasIntegrante,
  getResumenIntegrante, patchMensualidad,
} from '../../api/integrantes'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/common/ToastProvider'
import client from '../../api/client'
import Badge from '../../components/common/Badge'
import '../../components/common/common.css'

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGO = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const ANIOS_ACTIVOS = [2026, 2025, 2024]
const ROLES_EDITAR_CUOTAS = ['admin', 'tesorero']

export default function IntegranteFicha() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('mensualidades')
  const [integrante, setIntegrante] = useState(null)
  const [mensualidades, setMensualidades] = useState([])
  const [participaciones, setParticipaciones] = useState([])
  const [deudas, setDeudas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)

  const canEdit = ROLES_EDITAR_CUOTAS.includes(user?.rol)

  const cargarMensualidades = () =>
    Promise.all([getMensualidadesIntegrante(id), getResumenIntegrante(id)])
      .then(([ms, rs]) => {
        const todas = ms.data.results || ms.data
        setMensualidades(todas.filter(m => m.anio <= 2026))
        setResumen(rs.data)
      })

  useEffect(() => {
    Promise.all([
      getIntegrante(id),
      getMensualidadesIntegrante(id),
      getParticipacionesIntegrante(id),
      getDeudasIntegrante(id),
      getResumenIntegrante(id),
    ]).then(([ig, ms, ps, ds, rs]) => {
      setIntegrante(ig.data)
      const todas = ms.data.results || ms.data
      setMensualidades(todas.filter(m => m.anio <= 2026))
      setParticipaciones(ps.data.results || ps.data)
      setDeudas(ds.data.results || ds.data)
      setResumen(rs.data)
    }).finally(() => setLoading(false))
  }, [id])

  const handleGuardarMensualidad = async (mensualidadId, datos) => {
    try {
      await patchMensualidad(mensualidadId, datos)
      await cargarMensualidades()
      setEditando(null)
      toast.success('Mensualidad actualizada correctamente.')
    } catch {
      toast.error('Error al actualizar la mensualidad.')
    }
  }

  if (loading) return <div className="loading">Cargando ficha...</div>
  if (!integrante) return <div className="error-msg">Integrante no encontrado</div>

  return (
    <div>
      {editando && (
        <ModalEditarMensualidad
          mensualidad={editando}
          onSave={handleGuardarMensualidad}
          onClose={() => setEditando(null)}
        />
      )}

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
        {/* Sidebar */}
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
                ['Rol', integrante.rol],
                ['RUT', integrante.rut],
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
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Resumen histórico 2024-2026
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <ResumenRow label="Cuotas pagadas"   value={resumen.cuotas_pagadas}   color="var(--accent-light)" />
                <ResumenRow label="Cuotas pendientes" value={resumen.cuotas_pendientes} color={resumen.cuotas_pendientes > 0 ? 'var(--danger)' : 'var(--accent-light)'} />
                <div style={{ height: 1, background: '#1e1e1e', margin: '2px 0' }} />
                <ResumenRow label="Total pagado"    value={`$${Number(resumen.total_pagado).toLocaleString('es-CL')}`}    color="var(--accent-light)" />
                <ResumenRow label="Total adeudado"  value={`$${Number(resumen.total_pendiente).toLocaleString('es-CL')}`}  color={resumen.total_pendiente > 0 ? 'var(--danger)' : 'var(--accent-light)'} />
                <div style={{ height: 1, background: '#1e1e1e', margin: '2px 0' }} />
                <ResumenRow label="Participaciones"  value={resumen.total_participaciones} />
                <ResumenRow label="Último pago"      value={resumen.ultimo_pago || '—'} color="var(--text-secondary)" />
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div>
          <div className="tabs">
            {[['mensualidades', 'Mensualidades'], ['participaciones', 'Participaciones'], ['deudas', 'Deudas'], ['reincorporacion', 'Reincorporacion']].map(([k, l]) => (
              <button key={k} className={`tab ${tab === k ? 'tab-active' : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === 'mensualidades' && (
            <MensualidadesTab
              mensualidades={mensualidades}
              canEdit={canEdit}
              onEdit={setEditando}
            />
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
                <div className="empty-state">Sin deudas adicionales registradas</div>
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

function ResumenRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function MensualidadesTab({ mensualidades, canEdit, onEdit }) {
  const porAnio = (anio) => mensualidades.filter(m => m.anio === anio)
  const hoy = new Date()
  const anioActual = hoy.getFullYear()
  const mesActual = hoy.getMonth() + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {canEdit && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 12px', background: 'rgba(61,122,61,0.08)', border: '1px solid rgba(61,122,61,0.2)', borderRadius: 4 }}>
          Haz clic en cualquier mes para editar su estado.
        </div>
      )}
      {ANIOS_ACTIVOS.map(anio => {
        const meses = porAnio(anio)
        const pagadas    = meses.filter(m => m.estado === 'pagada').length
        // Solo contar como pendiente hasta el mes actual del año en curso
        const esPeriodoVencido = (m) => anio < anioActual || (anio === anioActual && m.mes <= mesActual)
        const pendientes = meses.filter(m => m.estado === 'pendiente' && esPeriodoVencido(m)).length
        const exentos    = meses.filter(m => m.estado === 'exento').length
        const totalPagado    = meses.filter(m => m.estado === 'pagada').reduce((s, m) => s + Number(m.monto), 0)
        const totalPendiente = meses.filter(m => m.estado === 'pendiente' && esPeriodoVencido(m)).reduce((s, m) => s + Number(m.monto), 0)

        return (
          <div key={anio} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Mensualidades {anio}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: 'var(--accent-light)' }}>✓ {pagadas} pagadas</span>
                {pendientes > 0 && <span style={{ color: 'var(--danger)' }}>✕ {pendientes} pendientes</span>}
                {exentos > 0  && <span style={{ color: 'var(--text-muted)' }}>— {exentos} exentos</span>}
              </div>
            </div>

            {meses.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>
                Sin registros para {anio}.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => {
                  const m = meses.find(x => x.mes === mes)
                  if (!m) return (
                    <div key={mes} style={{ padding: '10px 8px', borderRadius: 4, textAlign: 'center', background: 'rgba(30,30,30,0.5)', border: '1px solid #1a1a1a', opacity: 0.4 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{MESES[mes]}</div>
                      <div style={{ fontSize: 11, color: '#333' }}>—</div>
                    </div>
                  )
                  const e = m.estado
                  const editable = canEdit
                  return (
                    <div
                      key={mes}
                      onClick={editable ? () => onEdit(m) : undefined}
                      title={editable ? `Editar ${MESES_LARGO[mes]} ${anio}` : undefined}
                      style={{
                        padding: '10px 8px', borderRadius: 4, textAlign: 'center',
                        background: e === 'pagada' ? 'rgba(61,122,61,0.22)' : e === 'exento' ? 'rgba(150,150,150,0.10)' : 'rgba(204,34,34,0.14)',
                        border: `1px solid ${e === 'pagada' ? 'rgba(61,122,61,0.45)' : e === 'exento' ? 'rgba(150,150,150,0.22)' : 'rgba(204,34,34,0.35)'}`,
                        cursor: editable ? 'pointer' : 'default',
                        transition: 'opacity 0.15s',
                        position: 'relative',
                      }}
                      onMouseEnter={editable ? e2 => { e2.currentTarget.style.opacity = '0.75' } : undefined}
                      onMouseLeave={editable ? e2 => { e2.currentTarget.style.opacity = '1' } : undefined}
                    >
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{MESES[mes]}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: e === 'pagada' ? 'var(--accent-light)' : e === 'exento' ? 'var(--text-muted)' : 'var(--danger)' }}>
                        {e === 'pagada' ? '✓' : e === 'exento' ? '—' : '✕'}
                      </div>
                      {editable && (
                        <div style={{ position: 'absolute', top: 3, right: 4, fontSize: 9, color: 'var(--text-muted)', opacity: 0.5 }}>✎</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {(pagadas > 0 || pendientes > 0) && (
              <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: '1px solid #1e1e1e', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Pagado: <strong style={{ color: 'var(--accent-light)' }}>${totalPagado.toLocaleString('es-CL')}</strong>
                </span>
                {totalPendiente > 0 && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Adeudado: <strong style={{ color: 'var(--danger)' }}>${totalPendiente.toLocaleString('es-CL')}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ModalEditarMensualidad({ mensualidad, onSave, onClose }) {
  const [estado, setEstado] = useState(mensualidad.estado)
  const [monto, setMonto] = useState(String(mensualidad.monto || 5000))
  const [saving, setSaving] = useState(false)

  const mesLabel = `${MESES_LARGO[mensualidad.mes]} ${mensualidad.anio}`

  const handleSave = async () => {
    setSaving(true)
    await onSave(mensualidad.id, {
      estado,
      monto: estado === 'pagada' ? parseInt(monto, 10) || 5000 : mensualidad.monto,
    })
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 4, padding: 28, width: 340, maxWidth: '90vw',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Editar mensualidad
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
          {mesLabel}
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Estado</label>
          <select
            className="form-control"
            value={estado}
            onChange={e => setEstado(e.target.value)}
          >
            <option value="pagada">Pagada</option>
            <option value="pendiente">Pendiente</option>
            <option value="exento">Exento</option>
          </select>
        </div>

        {estado === 'pagada' && (
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Monto ($)</label>
            <input
              type="number"
              className="form-control"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              min={0}
              step={500}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
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
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cuotas pendientes (hasta 2026-12)</div>
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
