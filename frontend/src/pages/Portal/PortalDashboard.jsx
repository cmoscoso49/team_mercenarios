import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

const ROW = {
  display: 'flex', gap: 12, padding: '7px 0',
  borderBottom: '1px solid var(--border-color)',
}
const ROW_LABEL = {
  minWidth: 80, fontSize: '0.75rem', fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--text-muted)', fontFamily: 'var(--font-display)',
}
const ROW_VALUE = { fontSize: '0.9rem', color: 'var(--text-secondary)' }

export default function PortalDashboard() {
  const [integrante, setIntegrante] = useState(null);
  const [cuotas, setCuotas]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [noVinculado, setNoVinculado] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/portal/me/').catch(e => ({ error: e })),
      apiClient.get('/portal/mis-cuotas/').catch(() => null),
    ]).then(([me, cuotasRes]) => {
      if (me.error || me.status === 404) {
        setNoVinculado(true);
      } else {
        setIntegrante(me.data);
        if (cuotasRes?.data) setCuotas(cuotasRes.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="portal-loading">Cargando...</div>;

  if (noVinculado) {
    return (
      <>
        <div className="portal-page-header">
          <span className="portal-page-tag">// Portal Personal</span>
          <h1 className="portal-page-title">Bienvenido</h1>
        </div>
        <div className="portal-alert">
          Tu cuenta no está vinculada a un integrante del team todavía.
          Contacta al administrador para activar tu portal personal.
        </div>
      </>
    );
  }

  const anioActual = new Date().getFullYear();
  const resumen    = cuotas?.resumen;
  const deudas     = cuotas?.deudas_pendientes || [];
  const mesesPendientes = cuotas?.mensualidades?.filter(m => m.estado === 'pendiente') || [];

  return (
    <>
      <div className="portal-page-header">
        <span className="portal-page-tag">// Portal Personal</span>
        <h1 className="portal-page-title">
          Bienvenido{integrante?.nick
            ? `, ${integrante.nick}`
            : integrante?.nombre
              ? `, ${integrante.nombre.split(' ')[0]}`
              : ''}
        </h1>
      </div>

      <div className="portal-stats-grid">
        <div className="portal-stat-card" style={{ '--stat-top': '#3fb950' }}>
          <span className="portal-stat-num green">{resumen?.pagadas ?? '—'}</span>
          <span className="portal-stat-label">Cuotas pagadas {anioActual}</span>
        </div>
        <div className="portal-stat-card" style={{ '--stat-top': resumen?.pendientes > 0 ? '#e3b341' : '#3fb950' }}>
          <span className="portal-stat-num" style={{ color: resumen?.pendientes > 0 ? '#e3b341' : '#3fb950' }}>
            {resumen?.pendientes ?? '—'}
          </span>
          <span className="portal-stat-label">Cuotas pendientes</span>
        </div>
        <div className="portal-stat-card" style={{ '--stat-top': deudas.length > 0 ? '#f85149' : '#3fb950' }}>
          <span className="portal-stat-num" style={{ color: deudas.length > 0 ? '#f85149' : '#3fb950' }}>
            {deudas.length}
          </span>
          <span className="portal-stat-label">Deudas activas</span>
        </div>
        <div className="portal-stat-card">
          <span className="portal-stat-num">{resumen?.porcentaje_al_dia ?? '—'}%</span>
          <span className="portal-stat-label">Al día {anioActual}</span>
        </div>
      </div>

      <div className="portal-grid-2">
        <div className="portal-card">
          <div className="portal-card-title">Cuotas pendientes {anioActual}</div>
          {mesesPendientes.length === 0 ? (
            <p style={{ color: '#3fb950', fontSize: '0.9rem', margin: 0 }}>
              ✓ Al día con todas las cuotas del año
            </p>
          ) : (
            <>
              {mesesPendientes.slice(0, 5).map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.mes_display}</span>
                  <span style={{ fontSize: '0.85rem', color: '#e3b341', fontWeight: 600 }}>
                    ${Number(m.monto).toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
              {mesesPendientes.length > 5 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                  +{mesesPendientes.length - 5} más
                </p>
              )}
              <Link to="/portal/mis-cuotas" style={{ display: 'inline-block', marginTop: 12, fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Ver todas →
              </Link>
            </>
          )}
        </div>

        <div className="portal-card">
          <div className="portal-card-title">Mi Ficha</div>
          <div style={ROW}><span style={ROW_LABEL}>Nombre</span>  <span style={ROW_VALUE}>{integrante?.nombre}</span></div>
          <div style={ROW}><span style={ROW_LABEL}>Nick</span>    <span style={ROW_VALUE}>{integrante?.nick || '—'}</span></div>
          <div style={ROW}><span style={ROW_LABEL}>Estado</span>  <span style={ROW_VALUE}>{integrante?.estado_display || integrante?.estado}</span></div>
          <div style={ROW}><span style={ROW_LABEL}>Rol</span>     <span style={ROW_VALUE}>{integrante?.rol_display || integrante?.rol}</span></div>
          <div style={ROW}><span style={ROW_LABEL}>Teléfono</span><span style={ROW_VALUE}>{integrante?.telefono || '—'}</span></div>
          <Link to="/portal/mi-perfil" style={{ display: 'inline-block', marginTop: 12, fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Editar perfil →
          </Link>
        </div>
      </div>

      {deudas.length > 0 && (
        <div className="portal-card" style={{ borderColor: 'rgba(248,81,73,0.2)' }}>
          <div className="portal-card-title">Deudas pendientes</div>
          {deudas.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{d.descripcion}</div>
                {d.fecha_vencimiento && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Vence: {new Date(d.fecha_vencimiento).toLocaleDateString('es-CL')}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f85149' }}>
                  ${Number(d.monto_pendiente).toLocaleString('es-CL')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pendiente</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
