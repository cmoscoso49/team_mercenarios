import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getIntegrante, createIntegrante, updateIntegrante } from '../../api/integrantes'
import '../../components/common/common.css'

const INITIAL = {
  nombre: '', rut: '', nick: '', telefono: '', email: '',
  fecha_nacimiento: '', fecha_ingreso: '',
  estado: 'activo', rol: 'player', talla_polera: '', observaciones: '',
}

export default function IntegranteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (isEdit) {
      getIntegrante(id).then((r) => {
        const d = r.data
        setForm({
          nombre: d.nombre || '', rut: d.rut || '', nick: d.nick || '',
          telefono: d.telefono || '', email: d.email || '',
          fecha_nacimiento: d.fecha_nacimiento || '', fecha_ingreso: d.fecha_ingreso || '',
          estado: d.estado || 'activo', rol: d.rol || 'player',
          talla_polera: d.talla_polera || '', observaciones: d.observaciones || '',
        })
      })
    }
  }, [id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const data = { ...form }
    if (!data.rut) delete data.rut
    if (!data.fecha_nacimiento) delete data.fecha_nacimiento
    if (!data.fecha_ingreso) delete data.fecha_ingreso
    try {
      if (isEdit) {
        await updateIntegrante(id, data)
      } else {
        await createIntegrante(data)
      }
      navigate('/integrantes')
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' | ') : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{isEdit ? 'Editar Integrante' : 'Nuevo Integrante'}</h2>
      </div>
      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input name="nombre" className="form-control" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nick / Apodo</label>
              <input name="nick" className="form-control" value={form.nick} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">RUT</label>
              <input name="rut" className="form-control" value={form.rut} onChange={handleChange} placeholder="12.345.678-9" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input name="telefono" className="form-control" value={form.telefono} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Talla Polera</label>
              <select name="talla_polera" className="form-control" value={form.talla_polera} onChange={handleChange}>
                <option value="">Sin definir</option>
                {['XS','S','M','L','XL','XXL'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select name="estado" className="form-control" value={form.estado} onChange={handleChange}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="pos_natal">Pos Natal</option>
                <option value="postulante">Postulante</option>
                <option value="suspendido">Suspendido</option>
                <option value="honorario">Honorario</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select name="rol" className="form-control" value={form.rol} onChange={handleChange}>
                <option value="admin">Admin</option>
                <option value="TL">Team Leader</option>
                <option value="presidente">Presidente</option>
                <option value="vice">Vice Presidente</option>
                <option value="secretario">Secretario</option>
                <option value="tesorero">Tesorero</option>
                <option value="player">Player</option>
                <option value="postulante">Postulante</option>
                <option value="invitado">Invitado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento</label>
              <input name="fecha_nacimiento" type="date" className="form-control" value={form.fecha_nacimiento} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Ingreso</label>
              <input name="fecha_ingreso" type="date" className="form-control" value={form.fecha_ingreso} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea name="observaciones" className="form-control" rows={3} value={form.observaciones} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/integrantes')}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
