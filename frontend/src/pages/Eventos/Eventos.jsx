import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEventos, deleteEvento } from '../../api/eventos'
import Badge from '../../components/common/Badge'
import { useToast } from '../../components/common/ToastProvider'
import { useConfirm } from '../../components/common/ConfirmModal'
import '../../components/common/common.css'

export default function Eventos() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ tipo: '', estado: '' })
  const toast   = useToast()
  const confirm = useConfirm()

  const cargar = () => {
    setLoading(true)
    const params = {}
    if (filtros.tipo) params.tipo = filtros.tipo
    if (filtros.estado) params.estado = filtros.estado
    getEventos(params).then(r => setEventos(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filtros])

  const handleDelete = (id, titulo) => {
    confirm({
      title: 'Eliminar evento',
      message: `¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await deleteEvento(id)
          toast.success(`Evento "${titulo}" eliminado.`)
          cargar()
        } catch {
          toast.error(`No se pudo eliminar "${titulo}".`)
        }
      },
    })
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Eventos y Calendario</h2>
        <Link to="/eventos/nuevo" className="btn btn-primary">+ Nuevo Evento</Link>
      </div>

      <div className="filters-row">
        <select className="form-control" style={{ width: 180 }} value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Todos los tipos</option>
          <option value="entrenamiento">Entrenamiento</option>
          <option value="partida">Partida</option>
          <option value="campeonato">Campeonato</option>
          <option value="reunion">Reunión</option>
          <option value="actividad">Actividad Interna</option>
          <option value="externo">Evento Externo</option>
        </select>
        <select className="form-control" style={{ width: 160 }} value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          <option value="programado">Programado</option>
          <option value="realizado">Realizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading">Cargando...</div> : eventos.length === 0 ? (
          <div className="empty-state">No hay eventos registrados</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Título</th><th>Tipo</th><th>Lugar</th><th>Estado</th><th>Asistentes</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {eventos.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{e.fecha}</td>
                    <td style={{ fontWeight: 600 }}>{e.titulo}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{e.tipo_display}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{e.lugar || '—'}</td>
                    <td><Badge value={e.estado} label={e.estado_display} /></td>
                    <td style={{ textAlign: 'center' }}>{e.total_asistentes}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/eventos/${e.id}/editar`} className="btn btn-secondary btn-sm">Editar</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id, e.titulo)}>Eliminar</button>
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
