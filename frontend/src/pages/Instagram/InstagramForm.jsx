import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getInstagramItem, createInstagram, updateInstagram } from '../../api/galeria'
import { useToast } from '../../components/common/ToastProvider'
import '../../components/common/common.css'

const ESTADO_OPTS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'lista',    label: 'Lista para publicar' },
  { value: 'publicada', label: 'Publicada (visible en inicio)' },
]

export default function InstagramForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isEdit = Boolean(id)
  const fileRef = useRef()

  const [form, setForm] = useState({
    titulo: '', texto: '', estado: 'borrador',
    destacado: false, url_publicacion: '',
  })
  const [imagenActual, setImagenActual] = useState(null)
  const [imagenFile, setImagenFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    getInstagramItem(id)
      .then(r => {
        const d = r.data
        setForm({
          titulo: d.titulo || '',
          texto: d.texto || '',
          estado: d.estado || 'borrador',
          destacado: d.destacado || false,
          url_publicacion: d.url_publicacion || '',
        })
        setImagenActual(d.imagen || null)
      })
      .catch(() => toast.error('Error al cargar publicación'))
      .finally(() => setLoading(false))
  }, [id])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagenFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData()
    fd.append('titulo', form.titulo)
    fd.append('texto', form.texto)
    fd.append('estado', form.estado)
    fd.append('destacado', form.destacado)
    fd.append('url_publicacion', form.url_publicacion)
    if (imagenFile) fd.append('imagen', imagenFile)

    try {
      if (isEdit) {
        await updateInstagram(id, fd)
        toast.success('Publicación actualizada.')
      } else {
        await createInstagram(fd)
        toast.success('Publicación creada.')
      }
      navigate('/instagram')
    } catch (err) {
      toast.error('Error al guardar. Verifica los datos.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/instagram" style={{ color: 'var(--text-muted)', fontSize: 12 }}>← Instagram</Link>
          <h2 className="page-title">{isEdit ? 'Editar Publicación' : 'Nueva Publicación'}</h2>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Imagen */}
          <div className="form-group">
            <label className="form-label">Imagen</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{ width: 100, height: 100, borderRadius: 2, border: '1px solid #2a2a2a', overflow: 'hidden', background: '#0d0d0d', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => fileRef.current?.click()}
              >
                {preview || imagenActual ? (
                  <img src={preview || imagenActual} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 28, color: '#333' }}>📷</span>
                )}
              </div>
              <div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                  {imagenActual || preview ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  JPG, PNG o WebP. Recomendado: cuadrada 1:1.
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              className="form-control"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              required
              placeholder="Ej: Campeonato Regional 2025"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción / Texto</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.texto}
              onChange={e => setForm({ ...form, texto: e.target.value })}
              placeholder="Texto que acompañará la publicación..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL de Instagram</label>
            <input
              className="form-control"
              type="url"
              value={form.url_publicacion}
              onChange={e => setForm({ ...form, url_publicacion: e.target.value })}
              placeholder="https://instagram.com/p/..."
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Link directo a la publicación. Si está vacío, el botón abre el perfil del team.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select
                className="form-control"
                value={form.estado}
                onChange={e => setForm({ ...form, estado: e.target.value })}
              >
                {ESTADO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={e => setForm({ ...form, destacado: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#b8952a' }}
                />
                <span className="form-label" style={{ margin: 0 }}>★ Marcar como destacado</span>
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Aparece primero en el grid.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear publicación'}
            </button>
            <Link to="/instagram" className="btn btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
