import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getIntegrantes, darDeBaja, reactivarIntegrante } from '../../api/integrantes'
import { useToast } from '../../components/common/ToastProvider'
import { useConfirm } from '../../components/common/ConfirmModal'
import Badge from '../../components/common/Badge'
import '../../components/common/common.css'

export default function Integrantes() {
  const [integrantes, setIntegrantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', estado: '', rol: '' })
  const toast   = useToast()
  const confirm = useConfirm()

  const cargar = () => {
    setLoading(true)
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.estado) params.estado = filters.estado
    if (filters.rol)    params.rol    = filters.rol
    getIntegrantes(params)
      .then((r) => setIntegrantes(r.data.results || r.data))
      .catch(() => setError('Error al cargar integrantes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filters])

  const handleDarDeBaja = (id, nombre) => {
    confirm({
      title: 'Dar de baja',
      message: `¿Dar de baja a ${nombre}? El integrante quedará inactivo y no se le cobrarán cuotas. Su historial se conserva y puede ser reactivado en cualquier momento.`,
      confirmLabel: 'Dar de baja',
      onConfirm: async () => {
        try {
          await darDeBaja(id)
          toast.success(`${nombre} fue dado de baja. Su historial queda conservado.`)
          cargar()
        } catch {
          toast.error(`No se pudo dar de baja a ${nombre}.`)
        }
      },
    })
  }

  const handleReactivar = (id, nombre) => {
    confirm({
      title: 'Reactivar integrante',
      message: `¿Reactivar a ${nombre}? Volverá a estado activo y se le cobrarán cuotas mensualmente.`,
      confirmLabel: 'Reactivar',
      confirmDanger: false,
      onConfirm: async () => {
        try {
          await reactivarIntegrante(id)
          toast.success(`${nombre} fue reactivado correctamente.`)
          cargar()
        } catch {
          toast.error(`No se pudo reactivar a ${nombre}.`)
        }
      },
    })
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
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Link to={`/integrantes/${i.id}`} className="btn btn-secondary btn-sm">Ver</Link>
                        <Link to={`/integrantes/${i.id}/editar`} className="btn btn-secondary btn-sm">Editar</Link>
                        {i.estado === 'inactivo' ? (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(61,122,61,0.15)', color: '#52a852', border: '1px solid rgba(61,122,61,0.3)' }}
                            onClick={() => handleReactivar(i.id, i.nombre)}
                          >
                            Reactivar
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(184,149,42,0.12)', color: '#b8952a', border: '1px solid rgba(184,149,42,0.3)' }}
                            onClick={() => handleDarDeBaja(i.id, i.nombre)}
                          >
                            Dar de baja
                          </button>
                        )}
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
