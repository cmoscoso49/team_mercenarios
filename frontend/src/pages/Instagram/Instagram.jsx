import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getInstagram, deleteInstagram, updateInstagram } from '../../api/galeria'
import { useToast } from '../../components/common/ToastProvider'
import { useConfirm } from '../../components/common/ConfirmModal'
import Badge from '../../components/common/Badge'
import '../../components/common/common.css'

const ESTADO_COLOR = {
  publicada: 'activo',
  borrador:  'inactivo',
  lista:     'pos_natal',
  error:     'suspendido',
}

export default function Instagram() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const toast   = useToast()
  const confirm = useConfirm()

  const cargar = () => {
    setLoading(true)
    const params = {}
    if (filtroEstado) params.estado = filtroEstado
    getInstagram(params)
      .then(r => setItems(r.data.results || r.data))
      .catch(() => toast.error('Error al cargar publicaciones'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filtroEstado])

  const handleToggleEstado = (item) => {
    const nuevoEstado = item.estado === 'publicada' ? 'borrador' : 'publicada'
    const label = nuevoEstado === 'publicada' ? 'Publicar' : 'Despublicar'
    confirm({
      title: `${label} publicación`,
      message: `¿${label} "${item.titulo}"?`,
      confirmLabel: label,
      confirmDanger: nuevoEstado !== 'publicada',
      onConfirm: async () => {
        try {
          const fd = new FormData()
          fd.append('estado', nuevoEstado)
          await updateInstagram(item.id, fd)
          toast.success(`Publicación ${nuevoEstado === 'publicada' ? 'publicada' : 'despublicada'}.`)
          cargar()
        } catch {
          toast.error('Error al actualizar estado.')
        }
      },
    })
  }

  const handleToggleDestacado = async (item) => {
    try {
      const fd = new FormData()
      fd.append('destacado', !item.destacado)
      await updateInstagram(item.id, fd)
      toast.success(item.destacado ? 'Quitado de destacados.' : 'Marcado como destacado.')
      cargar()
    } catch {
      toast.error('Error al actualizar destacado.')
    }
  }

  const handleDelete = (item) => {
    confirm({
      title: 'Eliminar publicación',
      message: `¿Eliminar "${item.titulo}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await deleteInstagram(item.id)
          toast.success('Publicación eliminada.')
          cargar()
        } catch {
          toast.error('Error al eliminar.')
        }
      },
    })
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Instagram del Team</h2>
        <Link to="/instagram/nueva" className="btn btn-primary">+ Nueva Publicación</Link>
      </div>

      <div className="filters-row" style={{ marginBottom: 16 }}>
        {[['', 'Todas'], ['publicada', 'Publicadas'], ['borrador', 'Borrador'], ['lista', 'Listas']].map(([val, label]) => (
          <button
            key={label}
            onClick={() => setFiltroEstado(val)}
            style={{
              fontFamily: 'Oswald, sans-serif', fontSize: '0.72rem', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px',
              border: '1px solid',
              borderColor: filtroEstado === val ? 'var(--accent)' : '#2a2a2a',
              background: filtroEstado === val ? 'rgba(61,122,61,0.18)' : 'transparent',
              color: filtroEstado === val ? 'var(--accent-light)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >{label}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">Sin publicaciones. <Link to="/instagram/nueva">Crear primera</Link></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Imagen</th>
                  <th>Título</th>
                  <th>Estado</th>
                  <th>Dest.</th>
                  <th>Creada</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.titulo}
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 2, border: '1px solid #2a2a2a' }}
                        />
                      ) : (
                        <div style={{ width: 44, height: 44, background: '#1a1a1a', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#333' }}>📷</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.titulo}</div>
                      {item.texto && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.texto.slice(0, 60)}…</div>}
                    </td>
                    <td><Badge value={ESTADO_COLOR[item.estado] || 'inactivo'} label={item.estado} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleDestacado(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: item.destacado ? '#b8952a' : '#333' }}
                        title={item.destacado ? 'Quitar destacado' : 'Marcar como destacado'}
                      >★</button>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString('es-CL') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Link to={`/instagram/${item.id}/editar`} className="btn btn-secondary btn-sm">Editar</Link>
                        <button
                          className="btn btn-sm"
                          style={item.estado === 'publicada'
                            ? { background: 'rgba(184,149,42,0.12)', color: '#b8952a', border: '1px solid rgba(184,149,42,0.3)' }
                            : { background: 'rgba(61,122,61,0.15)', color: '#52a852', border: '1px solid rgba(61,122,61,0.3)' }
                          }
                          onClick={() => handleToggleEstado(item)}
                        >
                          {item.estado === 'publicada' ? 'Despublicar' : 'Publicar'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item)}
                        >Eliminar</button>
                      </div>
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
