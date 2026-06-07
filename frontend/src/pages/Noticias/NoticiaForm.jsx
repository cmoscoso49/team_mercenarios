import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNoticia, createNoticia, updateNoticia } from '../../api/noticias'
import '../../components/common/common.css'

const INITIAL = { titulo: '', resumen: '', contenido: '', estado: 'borrador', visibilidad: 'integrantes', destacada: false }

export default function NoticiaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (isEdit) {
      getNoticia(id).then(r => {
        const d = r.data
        setForm({ titulo: d.titulo || '', resumen: d.resumen || '', contenido: d.contenido || '', estado: d.estado || 'borrador', visibilidad: d.visibilidad || 'integrantes', destacada: d.destacada || false })
      })
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit) await updateNoticia(id, form)
      else await createNoticia(form)
      navigate('/noticias')
    } catch (err) {
      setError(err.response?.data ? Object.values(err.response.data).flat().join(' | ') : 'Error al guardar')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{isEdit ? 'Editar Noticia' : 'Nueva Noticia'}</h2>
      </div>
      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-control" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-control" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
                <option value="archivado">Archivado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visibilidad</label>
              <select className="form-control" value={form.visibilidad} onChange={e => setForm({ ...form, visibilidad: e.target.value })}>
                <option value="publica">Pública</option>
                <option value="privada">Privada</option>
                <option value="integrantes">Solo Integrantes</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destacada</label>
              <select className="form-control" value={form.destacada ? 'true' : 'false'} onChange={e => setForm({ ...form, destacada: e.target.value === 'true' })}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Resumen</label>
            <textarea className="form-control" rows={2} value={form.resumen} onChange={e => setForm({ ...form, resumen: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Contenido *</label>
            <textarea className="form-control" rows={8} value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })} required style={{ fontFamily: 'var(--font)', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/noticias')}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
