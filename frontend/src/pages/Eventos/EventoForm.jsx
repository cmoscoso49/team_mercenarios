import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEvento, createEvento, updateEvento } from '../../api/eventos'
import '../../components/common/common.css'

const INITIAL = { titulo: '', tipo: 'partida', fecha: '', hora: '', lugar: '', descripcion: '', estado: 'programado', observaciones: '' }

export default function EventoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (isEdit) {
      getEvento(id).then(r => {
        const d = r.data
        setForm({
          titulo: d.titulo || '', tipo: d.tipo || 'partida',
          fecha: d.fecha || '', hora: d.hora || '', lugar: d.lugar || '',
          descripcion: d.descripcion || '', estado: d.estado || 'programado',
          observaciones: d.observaciones || '',
        })
      })
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const data = { ...form }
    if (!data.hora) delete data.hora
    try {
      if (isEdit) await updateEvento(id, data)
      else await createEvento(data)
      navigate('/eventos')
    } catch (err) {
      setError(err.response?.data ? Object.values(err.response.data).flat().join(' | ') : 'Error al guardar')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{isEdit ? 'Editar Evento' : 'Nuevo Evento'}</h2>
      </div>
      <div className="card" style={{ maxWidth: 620 }}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Título *</label>
              <input className="form-control" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo *</label>
              <select className="form-control" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="entrenamiento">Entrenamiento</option>
                <option value="partida">Partida</option>
                <option value="campeonato">Campeonato</option>
                <option value="reunion">Reunión</option>
                <option value="actividad">Actividad Interna</option>
                <option value="externo">Evento Externo</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-control" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="programado">Programado</option>
                <option value="realizado">Realizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input className="form-control" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Hora</label>
              <input className="form-control" type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Lugar</label>
              <input className="form-control" value={form.lugar} onChange={e => setForm({ ...form, lugar: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Descripción</label>
              <textarea className="form-control" rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/eventos')}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
