import React, { useEffect, useState } from 'react'
import {
  getResumenFinanciero, getMovimientos, createMovimiento, deleteMovimiento,
  getMensualidades, getDeudas, getCategorias
} from '../../api/finanzas'
import Badge from '../../components/common/Badge'
import StatCard from '../../components/common/StatCard'
import { useToast } from '../../components/common/ToastProvider'
import { useConfirm } from '../../components/common/ConfirmModal'
import '../../components/common/common.css'

function MovimientosTab() {
  const [movimientos, setMovimientos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filtros, setFiltros] = useState({ tipo: '', search: '' })
  const [form, setForm] = useState({ tipo: 'egreso', monto: '', descripcion: '', fecha: '', categoria: '', es_caja_chica: false, observaciones: '' })
  const [saving, setSaving] = useState(false)
  const toast   = useToast()
  const confirm = useConfirm()

  const cargar = () => {
    const params = {}
    if (filtros.tipo) params.tipo = filtros.tipo
    if (filtros.search) params.search = filtros.search
    getMovimientos(params).then(r => setMovimientos(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    getCategorias().then(r => setCategorias(r.data.results || r.data))
    cargar()
  }, [filtros])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createMovimiento({ ...form, monto: Number(form.monto) })
      setShowForm(false)
      setForm({ tipo: 'egreso', monto: '', descripcion: '', fecha: '', categoria: '', es_caja_chica: false, observaciones: '' })
      toast.success('Movimiento registrado correctamente.')
      cargar()
    } catch { toast.error('Error al guardar el movimiento.') }
    finally { setSaving(false) }
  }

  const handleDelete = (id) => {
    confirm({
      title: 'Eliminar movimiento',
      message: '¿Eliminar este movimiento? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await deleteMovimiento(id)
          toast.success('Movimiento eliminado.')
          cargar()
        } catch {
          toast.error('No se pudo eliminar el movimiento.')
        }
      },
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="filters-row" style={{ marginBottom: 0 }}>
          <input className="form-control" style={{ width: 200 }} placeholder="Buscar..." value={filtros.search} onChange={e => setFiltros({ ...filtros, search: e.target.value })} />
          <select className="form-control" style={{ width: 150 }} value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo Movimiento</button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className={`modal modal-${form.tipo}`}>
            <div className="modal-title">{form.tipo === 'ingreso' ? '↑ Nuevo Ingreso' : '↓ Nuevo Egreso'}</div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo *</label>
                  <select name="tipo" className="form-control" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Monto *</label>
                  <input className="form-control" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input className="form-control" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-control" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value || null })}>
                    <option value="">Sin categoría</option>
                    {categorias.filter(c => c.tipo === form.tipo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <input className="form-control" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading">Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Descripción</th><th>Categoría</th><th></th></tr>
              </thead>
              <tbody>
                {movimientos.map(m => (
                  <tr key={m.id}>
                    <td>{m.fecha}</td>
                    <td><Badge value={m.tipo} label={m.tipo_display} /></td>
                    <td style={{ fontWeight: 700, color: m.tipo === 'ingreso' ? 'var(--accent-light)' : 'var(--danger)' }}>
                      ${Number(m.monto).toLocaleString('es-CL')}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.descripcion}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.categoria_nombre || '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MensualidadesTab() {
  const [mensualidades, setMensualidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ anio: 2025, estado: '' })

  useEffect(() => {
    getMensualidades(filtros).then(r => setMensualidades(r.data.results || r.data)).finally(() => setLoading(false))
  }, [filtros])

  return (
    <div>
      <div className="filters-row">
        <input className="form-control" style={{ width: 100 }} type="number" value={filtros.anio} onChange={e => setFiltros({ ...filtros, anio: e.target.value })} />
        <select className="form-control" style={{ width: 150 }} value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos</option>
          <option value="pagada">Pagadas</option>
          <option value="pendiente">Pendientes</option>
          <option value="exento">Exentos</option>
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading">Cargando...</div> : (
          <table>
            <thead><tr><th>Integrante</th><th>Año</th><th>Mes</th><th>Monto</th><th>Estado</th><th>Fecha Pago</th></tr></thead>
            <tbody>
              {mensualidades.map(m => (
                <tr key={m.id}>
                  <td>{m.integrante_nombre}</td>
                  <td>{m.anio}</td>
                  <td>{m.mes_display}</td>
                  <td>${Number(m.monto).toLocaleString('es-CL')}</td>
                  <td><Badge value={m.estado} /></td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.fecha_pago || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function DeudasTab() {
  const [deudas, setDeudas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDeudas({ estado: 'pendiente' }).then(r => setDeudas(r.data.results || r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="card" style={{ padding: 0 }}>
      {loading ? <div className="loading">Cargando...</div> : deudas.length === 0 ? (
        <div className="empty-state">Sin deudas pendientes</div>
      ) : (
        <table>
          <thead><tr><th>Integrante</th><th>Descripción</th><th>Total</th><th>Pagado</th><th>Pendiente</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {deudas.map(d => (
              <tr key={d.id}>
                <td>{d.integrante_nombre}</td>
                <td>{d.descripcion}</td>
                <td>${Number(d.monto_total).toLocaleString('es-CL')}</td>
                <td>${Number(d.monto_pagado).toLocaleString('es-CL')}</td>
                <td style={{ color: 'var(--danger)', fontWeight: 700 }}>${Number(d.monto_pendiente).toLocaleString('es-CL')}</td>
                <td><Badge value={d.estado} /></td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.fecha_origen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function Finanzas() {
  const [tab, setTab] = useState('movimientos')
  const [resumen, setResumen] = useState(null)

  useEffect(() => {
    getResumenFinanciero().then(r => setResumen(r.data))
  }, [])

  return (
    <div>
      <h2 className="page-title" style={{ marginBottom: 16 }}>Finanzas</h2>

      {resumen && (
        <div className="grid-stats" style={{ marginBottom: 20 }}>
          <StatCard label="Saldo Actual" value={resumen.saldo} prefix="$" color="green" />
          <StatCard label="Ingresos del Mes" value={resumen.ingresos_mes} prefix="$" color="green" />
          <StatCard label="Egresos del Mes" value={resumen.egresos_mes} prefix="$" color="red" />
          <StatCard label="Deudas Pendientes" value={resumen.deudas_total} prefix="$" color="yellow" />
        </div>
      )}

      <div className="tabs">
        {[['movimientos', 'Movimientos'], ['mensualidades', 'Mensualidades'], ['deudas', 'Deudas']].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? 'tab-active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'movimientos' && <MovimientosTab />}
      {tab === 'mensualidades' && <MensualidadesTab />}
      {tab === 'deudas' && <DeudasTab />}
    </div>
  )
}
