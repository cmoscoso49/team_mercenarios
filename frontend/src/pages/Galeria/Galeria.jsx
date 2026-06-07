import React, { useEffect, useState } from 'react'
import { getAlbums, createAlbum, deleteAlbum } from '../../api/galeria'
import '../../components/common/common.css'

export default function Galeria() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titulo: '', descripcion: '' })
  const [saving, setSaving] = useState(false)

  const cargar = () => {
    setLoading(true)
    getAlbums().then(r => setAlbums(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createAlbum(form)
      setShowForm(false)
      setForm({ titulo: '', descripcion: '' })
      cargar()
    } catch { alert('Error al crear álbum') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar álbum "${titulo}"?`)) return
    await deleteAlbum(id)
    cargar()
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Galería de Fotos</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo Álbum</button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">Nuevo Álbum</div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="form-control" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-control" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Cargando...</div> : albums.length === 0 ? (
        <div className="empty-state">No hay álbumes creados</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {albums.map(a => (
            <div key={a.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 120, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                🖼️
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{a.titulo}</div>
                {a.descripcion && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{a.descripcion.slice(0, 60)}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {a.evento_titulo ? `📅 ${a.evento_titulo}` : ''} · {a.total_fotos} fotos
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id, a.titulo)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
