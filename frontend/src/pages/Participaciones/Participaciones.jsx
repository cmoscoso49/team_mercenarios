import React, { useEffect, useState } from 'react'
import { getParticipaciones } from '../../api/eventos'
import Badge from '../../components/common/Badge'
import '../../components/common/common.css'

export default function Participaciones() {
  const [participaciones, setParticipaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ asistio: '' })

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filtros.asistio !== '') params.asistio = filtros.asistio
    getParticipaciones(params)
      .then(r => setParticipaciones(r.data.results || r.data))
      .finally(() => setLoading(false))
  }, [filtros])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Participaciones</h2>
      </div>

      <div className="filters-row">
        <select className="form-control" style={{ width: 160 }} value={filtros.asistio} onChange={e => setFiltros({ ...filtros, asistio: e.target.value })}>
          <option value="">Todos</option>
          <option value="true">Asistieron</option>
          <option value="false">No asistieron</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading">Cargando...</div> : participaciones.length === 0 ? (
          <div className="empty-state">Sin participaciones registradas</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Integrante</th><th>Nick</th><th>Evento</th><th>Fecha</th><th>Asistió</th></tr>
              </thead>
              <tbody>
                {participaciones.map(p => (
                  <tr key={p.id}>
                    <td>{p.integrante_nombre}</td>
                    <td style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{p.integrante_nick || '—'}</td>
                    <td>{p.evento_titulo}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.evento_fecha}</td>
                    <td><Badge value={p.asistio ? 'activo' : 'inactivo'} label={p.asistio ? 'Sí' : 'No'} /></td>
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
