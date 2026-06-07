import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getIntegrantes, deleteIntegrante } from '../../api/integrantes'
import Badge from '../../components/common/Badge'
import '../../components/common/common.css'

export default function Integrantes() {
  const [integrantes, setIntegrantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', estado: '', rol: '' })

  const cargar = () => {
    setLoading(true)
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.estado) params.estado = filters.estado
    if (filters.rol) params.rol = filters.rol
    getIntegrantes(params)
      .then((r) => setIntegrantes(r.data.results || r.data))
      .catch(() => setError('Error al cargar integrantes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filters])

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar a ${nombre}?`)) return
    try {
      await deleteIntegrante(id)
      cargar()
    } catch { alert('Error al eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Integrantes del Team</h2>
        <Link to="/integrantes/nuevo" className="btn btn-primary">+ Nuevo Integrante</Link>
      </div>

      <div className="filters-row">
        <input
          className="form-control"
          style={{ width: 220 }}
          placeholder="Buscar nombre, nick, RUT..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="form-control"
          style={{ width: 160 }}
          value={filters.estado}
          onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="pos_natal">Pos Natal</option>
          <option value="postulante">Postulante</option>
          <option value="suspendido">Suspendido</option>
          <option value="honorario">Honorario</option>
        </select>
        <select
          className="form-control"
          style={{ width: 160 }}
          value={filters.rol}
          onChange={(e) => setFilters({ ...filters, rol: e.target.value })}
        >
          <option value="">Todos los roles</option>
          <option value="capitan">Capitán</option>
          <option value="tesorero">Tesorero</option>
          <option value="integrante">Integrante</option>
          <option value="postulante">Postulante</option>
          <option value="invitado">Invitado</option>
        </select>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : integrantes.length === 0 ? (
          <div className="empty-state">No hay integrantes registrados</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nick</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Rol</th>
                  <th>Talla</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {integrantes.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{i.nick || '—'}</td>
                    <td>{i.nombre}</td>
                    <td><Badge value={i.estado} /></td>
                    <td style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{i.rol}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{i.talla_polera || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{i.telefono || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/integrantes/${i.id}`} className="btn btn-secondary btn-sm">Ver</Link>
                        <Link to={`/integrantes/${i.id}/editar`} className="btn btn-secondary btn-sm">Editar</Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(i.id, i.nombre)}
                        >
                          Eliminar
                        </button>
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
