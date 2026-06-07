import { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const TIPO_COLOR = {
  entrenamiento: '#3d7a3d',
  partida: '#cc2222',
  campeonato: '#b8952a',
  reunion: '#5588cc',
  actividad: '#888',
  externo: '#8855cc',
};

export default function MisEventos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noVinculado, setNoVinculado] = useState(false);

  useEffect(() => {
    apiClient.get('/portal/mis-eventos/')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => {
        if (err.response?.status === 404) setNoVinculado(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="portal-loading">Cargando eventos...</div>;

  if (noVinculado) {
    return (
      <>
        <div className="portal-page-header">
          <span className="portal-page-tag">// Mis Eventos</span>
          <h1 className="portal-page-title">Eventos</h1>
        </div>
        <div className="portal-alert">Cuenta no vinculada. Contacta al administrador.</div>
      </>
    );
  }

  const proximos  = data?.proximos  || [];
  const historial = data?.historial || [];

  return (
    <>
      <div className="portal-page-header">
        <span className="portal-page-tag">// Mis Eventos</span>
        <h1 className="portal-page-title">Eventos</h1>
      </div>

      {/* Próximos */}
      <div className="portal-card">
        <div className="portal-card-title">Próximos eventos</div>
        {proximos.length === 0 ? (
          <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>Sin eventos programados próximamente.</p>
        ) : (
          proximos.map(ev => <EventoRow key={ev.id} ev={ev} />)
        )}
      </div>

      {/* Historial */}
      <div className="portal-card">
        <div className="portal-card-title">Historial de participación</div>
        {historial.length === 0 ? (
          <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>Sin historial de eventos.</p>
        ) : (
          historial.map(ev => <EventoRow key={ev.id} ev={ev} conParticipacion />)
        )}
      </div>
    </>
  );
}

function EventoRow({ ev, conParticipacion = false }) {
  const color = TIPO_COLOR[ev.tipo] || '#666';
  return (
    <div style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid #111', alignItems: 'flex-start' }}>
      <div style={{
        minWidth: 48, textAlign: 'center', background: '#0d0d0d',
        border: `1px solid ${color}44`, padding: '6px 4px',
      }}>
        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.1rem', fontWeight: 700, color, lineHeight: 1 }}>
          {new Date(ev.fecha + 'T12:00:00').getDate()}
        </div>
        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555' }}>
          {new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-CL', { month: 'short' })}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.97rem', fontWeight: 600, color: '#e0e0e0' }}>{ev.titulo}</span>
          <span style={{
            background: color + '1a', color, border: `1px solid ${color}33`,
            padding: '1px 6px', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>{ev.tipo_display}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>
          {ev.lugar && <span>{ev.lugar}</span>}
          {ev.hora && <span style={{ marginLeft: 8 }}>· {ev.hora.slice(0, 5)}</span>}
          {ev.estado !== 'programado' && (
            <span style={{ marginLeft: 8, color: ev.estado === 'realizado' ? '#555' : '#cc2222' }}>
              · {ev.estado_display}
            </span>
          )}
        </div>
      </div>
      {conParticipacion && (
        <div style={{ textAlign: 'right', minWidth: 70 }}>
          {ev.asistio === true && <span style={{ color: '#52a852', fontSize: '0.82rem', fontWeight: 600 }}>✓ Asistió</span>}
          {ev.asistio === false && <span style={{ color: '#cc2222', fontSize: '0.82rem', fontWeight: 600 }}>✗ No asistió</span>}
          {ev.asistio === null && <span style={{ color: '#555', fontSize: '0.82rem' }}>—</span>}
        </div>
      )}
    </div>
  );
}
