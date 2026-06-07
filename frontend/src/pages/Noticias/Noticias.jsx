import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNoticias, deleteNoticia } from '../../api/noticias'
import Badge from '../../components/common/Badge'
import '../../components/common/common.css'

export default function Noticias() {
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ estado: '', visibilidad: '' })

  const cargar = () => {
    setLoading(true)
    const params = {}
    if (filtros.estado) params.estado = filtros.estado
    if (filtros.visibilidad) params.visibilidad = filtros.visibilidad
    getNoticias(params).then(r => setNoticias(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filtros])

  const handleDelete = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar "${titulo}"?`)) return
    await deleteNoticia(id)
    cargar()
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Noticias y Comunicados</h2>
        <Link to="/noticias/nueva" className="btn btn-primary">+ Nueva Noticia</Link>
      </div>

      <div className="filters-row">
        <select className="form-control" style={{ width: 160 }} value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="publicado">Publicado</option>
          <option value="archivado">Archivado</option>
        </select>
        <select className="form-control" style={{ width: 180 }} value={filtros.visibilidad} onChange={e => setFiltros({ ...filtros, visibilidad: e.target.value })}>
          <option value="">Todas las visibilidades</option>
          <option value="publica">Pública</option>
          <option value="privada">Privada</option>
          <option value="integrantes">Solo Integrantes</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading">Cargando...</div> : noticias.length === 0 ? (
          <div className="empty-state">No hay noticias registradas</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Título</th><th>Estado</th><th>Visibilidad</th><th>Autor</th><th>Fecha</th><th>Destacada</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {noticias.map(n => (
                  <tr key={n.id}>
                    <td style={{ fontWeight: 600 }}>{n.titulo}</td>
                    <td><Badge value={n.estado} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{n.visibilidad}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{n.autor_nombre || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{n.fecha_publicacion}</td>
                    <td style={{ textAlign: 'center' }}>{n.destacada ? '⭐' : ''}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/noticias/${n.id}/editar`} className="btn btn-secondary btn-sm">Editar</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id, n.titulo)}>Eliminar</button>
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
