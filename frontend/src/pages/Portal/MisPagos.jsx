import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const ESTADO_COLOR = {
  completado: '#4ade80',
  pendiente:  '#b8952a',
  fallido:    '#ef4444',
  expirado:   '#6b7280',
  cancelado:  '#6b7280',
};

export default function MisPagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/portal/pagos/')
      .then(res => { setPagos(res.data); setLoading(false); })
      .catch(() => { setError('No se pudo cargar el historial.'); setLoading(false); });
  }, []);

  if (loading) return <div className="portal-loading">Cargando pagos...</div>;

  return (
    <>
      <div className="portal-page-header">
        <span className="portal-page-tag">// Mis Pagos</span>
        <h1 className="portal-page-title">Historial de Pagos Online</h1>
      </div>

      {error && <div className="portal-alert">{error}</div>}

      {!error && pagos.length === 0 && (
        <div className="portal-alert portal-alert-info">
          Sin pagos online registrados.{' '}
          <Link to="/portal/mis-cuotas" style={{ color: '#cc2222' }}>Ir a Mis Cuotas</Link> para pagar mensualidades.
        </div>
      )}

      {pagos.length > 0 && (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                {['Fecha', 'Cuotas', 'Monto', 'Estado', 'Orden'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontFamily: 'Oswald, sans-serif', fontSize: '0.68rem',
                    fontWeight: 600, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#555',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #111' }}>
                  <td style={{ padding: '11px 14px', fontSize: '0.85rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {new Date(p.fecha_creacion).toLocaleDateString('es-CL')}
                    <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: 2 }}>
                      {new Date(p.fecha_creacion).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    {p.mensualidades_detalle?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {p.mensualidades_detalle.map(m => (
                          <span key={m.id} style={{
                            fontFamily: 'Oswald, sans-serif', fontSize: '0.7rem',
                            letterSpacing: 1, textTransform: 'uppercase',
                            background: '#131313', border: '1px solid #222',
                            color: '#9ca3af', padding: '2px 6px',
                          }}>
                            {MESES[m.mes]} {m.anio}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#4b5563', fontSize: '0.82rem' }}>—</span>
                    )}
                  </td>
                  <td style={{
                    padding: '11px 14px',
                    fontFamily: "'Share Tech Mono', 'Courier New', monospace",
                    fontSize: '0.92rem', fontWeight: 700,
                    color: p.estado === 'completado' ? '#4ade80' : '#d1d5db',
                    whiteSpace: 'nowrap',
                  }}>
                    ${Number(p.monto).toLocaleString('es-CL')} CLP
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      fontFamily: 'Oswald, sans-serif', fontSize: '0.7rem',
                      fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
                      color: ESTADO_COLOR[p.estado] || '#d1d5db',
                      border: `1px solid ${ESTADO_COLOR[p.estado] || '#333'}`,
                      padding: '3px 8px', opacity: 0.9,
                    }}>
                      {p.estado_display}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '0.72rem', color: '#4b5563', fontFamily: 'monospace' }}>
                    {p.orden_id.slice(0, 8)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
