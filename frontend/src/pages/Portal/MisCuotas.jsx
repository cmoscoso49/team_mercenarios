import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useToast } from '../../components/common/ToastProvider';

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function MisCuotas() {
  const ANIO_MAX = 2025;
  const [anio, setAnio] = useState(ANIO_MAX);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noVinculado, setNoVinculado] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [paying, setPaying] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    setSelectedIds(new Set());
    apiClient.get(`/portal/mis-cuotas/?anio=${anio}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => {
        if (err.response?.status === 404) setNoVinculado(true);
        setLoading(false);
      });
  }, [anio]);

  const toggleId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePagar = async () => {
    if (selectedIds.size === 0 || paying) return;
    setPaying(true);
    try {
      const res = await apiClient.post('/portal/pagos/crear/', {
        mensualidades: [...selectedIds],
      });
      sessionStorage.setItem('tm_pago_orden_id', res.data.orden_id);
      window.location.href = res.data.url_pago;
    } catch (err) {
      showToast('error', 'Error de pago', err.response?.data?.error || 'No se pudo conectar con Flow. Intenta más tarde.');
      setPaying(false);
    }
  };

  const anios = [2025, 2024, 2023, 2022];

  if (loading) return <div className="portal-loading">Cargando cuotas...</div>;

  if (noVinculado) {
    return (
      <>
        <div className="portal-page-header">
          <span className="portal-page-tag">// Mis Cuotas</span>
          <h1 className="portal-page-title">Mensualidades</h1>
        </div>
        <div className="portal-alert">Cuenta no vinculada. Contacta al administrador.</div>
      </>
    );
  }

  const mensualidades = data?.mensualidades || [];
  const deudas = data?.deudas_pendientes || [];
  const resumen = data?.resumen || {};

  const montoSeleccionado = mensualidades
    .filter(m => selectedIds.has(m.id))
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const pendientesCount = mensualidades.filter(m => m.estado === 'pendiente').length;

  return (
    <>
      <div className="portal-page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span className="portal-page-tag">// Mis Cuotas</span>
          <h1 className="portal-page-title">Mensualidades</h1>
        </div>
        <select
          value={anio}
          onChange={e => setAnio(Number(e.target.value))}
          style={{
            background: '#131313', border: '1px solid #2a2a2a', color: '#d0d0d0',
            fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem',
            padding: '6px 12px', outline: 'none',
          }}
        >
          {anios.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Resumen */}
      <div className="portal-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <div className="portal-stat-card">
          <span className="portal-stat-num" style={{ color: '#52a852' }}>{resumen.pagadas ?? 0}</span>
          <span className="portal-stat-label">Pagadas</span>
        </div>
        <div className="portal-stat-card">
          <span className="portal-stat-num" style={{ color: resumen.pendientes > 0 ? '#b8952a' : '#52a852' }}>{resumen.pendientes ?? 0}</span>
          <span className="portal-stat-label">Pendientes</span>
        </div>
        <div className="portal-stat-card">
          <span className="portal-stat-num">{resumen.porcentaje_al_dia ?? 0}%</span>
          <span className="portal-stat-label">Al día {anio}</span>
        </div>
      </div>

      {/* Grid visual de meses */}
      <div className="portal-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="portal-card-title" style={{ marginBottom: 0 }}>Estado mensual — {anio}</div>
          {pendientesCount > 0 && (
            <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#4b5563' }}>
              Selecciona cuotas para pagar
            </span>
          )}
        </div>

        {mensualidades.length === 0 ? (
          <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>Sin registros para {anio}.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
            {mensualidades.map(m => {
              const isSelected = selectedIds.has(m.id);
              const isPendiente = m.estado === 'pendiente';
              return (
                <div
                  key={m.id}
                  onClick={() => isPendiente && toggleId(m.id)}
                  style={{
                    background: isSelected ? 'rgba(204,34,34,0.07)' : '#0d0d0d',
                    border: `1px solid ${
                      isSelected        ? 'rgba(204,34,34,0.7)' :
                      m.estado === 'pagada'  ? 'rgba(61,122,61,0.35)' :
                      m.estado === 'exento' ? 'rgba(100,100,100,0.3)' :
                                              'rgba(184,149,42,0.35)'
                    }`,
                    padding: '12px 14px',
                    cursor: isPendiente ? 'pointer' : 'default',
                    position: 'relative',
                    transition: 'border-color 0.15s, background 0.15s',
                    outline: isSelected ? '1px solid rgba(204,34,34,0.2)' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  {/* Checkmark indicator */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 14, height: 14,
                      background: '#cc2222',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#fff', fontWeight: 700,
                    }}>✓</div>
                  )}

                  <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>
                    {MESES[m.mes]} {anio}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span className={`portal-badge portal-badge-${m.estado}`}>
                      {m.estado_display}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1rem', fontWeight: 700, color: m.estado === 'pagada' ? '#52a852' : m.estado === 'exento' ? '#666' : '#b8952a' }}>
                    ${Number(m.monto).toLocaleString('es-CL')}
                  </div>
                  {m.fecha_pago && (
                    <div style={{ fontSize: '0.72rem', color: '#555', marginTop: 4 }}>
                      {new Date(m.fecha_pago).toLocaleDateString('es-CL')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Barra de pago — aparece al seleccionar cuotas */}
        {selectedIds.size > 0 && (
          <div style={{
            position: 'sticky',
            bottom: 16,
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '10px 14px',
            background: 'rgba(13,8,8,0.97)',
            border: '1px solid rgba(204,34,34,0.35)',
            borderLeft: '3px solid #cc2222',
            backdropFilter: 'blur(6px)',
          }}>
            <div>
              <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: '#6b7280' }}>
                {selectedIds.size} cuota{selectedIds.size !== 1 ? 's' : ''} —
              </span>
              <span style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: 15, fontWeight: 700, color: '#ef4444', marginLeft: 8 }}>
                ${montoSeleccionado.toLocaleString('es-CL')} CLP
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{ background: 'none', border: '1px solid #2a1e1e', color: '#6b7280', fontFamily: 'Oswald, sans-serif', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', padding: '7px 14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handlePagar}
                disabled={paying}
                style={{
                  background: paying ? '#7a1414' : '#cc2222',
                  border: 'none',
                  color: '#fff',
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  padding: '8px 20px',
                  cursor: paying ? 'not-allowed' : 'pointer',
                  opacity: paying ? 0.7 : 1,
                  transition: 'background 0.15s',
                }}
              >
                {paying ? 'Iniciando...' : 'Pagar con Flow →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deudas */}
      {deudas.length > 0 && (
        <div className="portal-card" style={{ borderColor: 'rgba(204,34,34,0.2)' }}>
          <div className="portal-card-title" style={{ color: '#cc2222' }}>Deudas pendientes</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                {['Descripción', 'Total', 'Pagado', 'Pendiente', 'Estado', 'Vencimiento'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'Oswald, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deudas.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #111' }}>
                  <td style={{ padding: '10px 12px', fontSize: '0.9rem', color: '#d0d0d0' }}>{d.descripcion}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.9rem', color: '#aaa' }}>${Number(d.monto_total).toLocaleString('es-CL')}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.9rem', color: '#52a852' }}>${Number(d.monto_pagado).toLocaleString('es-CL')}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.95rem', fontWeight: 700, color: '#cc2222' }}>${Number(d.monto_pendiente).toLocaleString('es-CL')}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="portal-badge portal-badge-pendiente">{d.estado_display}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '0.82rem', color: '#666' }}>
                    {d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toLocaleDateString('es-CL') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deudas.length === 0 && (
        <div className="portal-alert portal-alert-info">Sin deudas pendientes. ✓</div>
      )}
    </>
  );
}
