import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import { useToast } from '../../components/common/ToastProvider';

const TIPO_COLOR = {
  entrenamiento: '#3d7a3d',
  partida:       '#cc2222',
  campeonato:    '#b8952a',
  reunion:       '#5588cc',
  actividad:     '#888',
  externo:       '#8855cc',
};

export default function MisEventos() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [noVinculado, setNoVinculado] = useState(false);
  const [confirmando, setConfirmando] = useState({});
  const toast = useToast();

  const cargar = useCallback(() => {
    apiClient.get('/portal/mis-eventos/')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => {
        if (err.response?.status === 404) setNoVinculado(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function confirmarAsistencia(eventoId, eventoTitulo, confirmado) {
    setConfirmando(prev => ({ ...prev, [eventoId]: true }));
    try {
      await apiClient.post(`/portal/eventos/${eventoId}/confirmar/`, { confirmado });
      toast.success(
        confirmado
          ? `Asistencia confirmada para ${eventoTitulo}.`
          : `Has indicado que no podrás asistir a ${eventoTitulo}.`,
        confirmado ? 'Confirmado' : 'Registrado'
      );
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al registrar asistencia.');
    } finally {
      setConfirmando(prev => ({ ...prev, [eventoId]: false }));
    }
  }

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
        <div className="portal-card-title">Próximos eventos — confirma tu asistencia</div>
        {proximos.length === 0 ? (
          <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>Sin eventos programados próximamente.</p>
        ) : (
          proximos.map(ev => (
            <EventoProximo
              key={ev.id}
              ev={ev}
              cargando={!!confirmando[ev.id]}
              onConfirmar={(conf) => confirmarAsistencia(ev.id, ev.titulo, conf)}
            />
          ))
        )}
      </div>

      {/* Historial */}
      <div className="portal-card">
        <div className="portal-card-title">Historial de participación</div>
        {historial.length === 0 ? (
          <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>Sin historial de eventos.</p>
        ) : (
          historial.map(ev => <EventoHistorial key={ev.id} ev={ev} />)
        )}
      </div>
    </>
  );
}

function EventoProximo({ ev, cargando, onConfirmar }) {
  const color = TIPO_COLOR[ev.tipo] || '#666';
  const confirmado = ev.confirmado;

  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #111', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <FechaBox fecha={ev.fecha} color={color} />
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.98rem', fontWeight: 600, color: '#e0e0e0' }}>{ev.titulo}</span>
          <TipoBadge tipo={ev.tipo} label={ev.tipo_display} color={color} />
        </div>
        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 10 }}>
          {ev.lugar && <span>{ev.lugar}</span>}
          {ev.hora && <span style={{ marginLeft: 8 }}>· {ev.hora.slice(0, 5)}</span>}
        </div>

        {/* Botones de confirmación */}
        {confirmado === true ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#52a852', fontSize: '0.85rem', fontWeight: 600 }}>✓ Confirmado</span>
            <button
              onClick={() => onConfirmar(false)}
              disabled={cargando}
              style={btnGhostStyle}
            >
              Cancelar asistencia
            </button>
          </div>
        ) : confirmado === false ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#cc2222', fontSize: '0.85rem', fontWeight: 600 }}>✗ No asistirás</span>
            <button
              onClick={() => onConfirmar(true)}
              disabled={cargando}
              style={btnGhostStyle}
            >
              Cambiar a sí asistiré
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => onConfirmar(true)}
              disabled={cargando}
              style={{
                fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(61,122,61,0.15)', color: '#52a852',
                border: '1px solid rgba(61,122,61,0.35)',
                padding: '5px 14px', cursor: cargando ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {cargando ? '...' : '✓ Asistiré'}
            </button>
            <button
              onClick={() => onConfirmar(false)}
              disabled={cargando}
              style={{
                fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(204,34,34,0.1)', color: '#cc6666',
                border: '1px solid rgba(204,34,34,0.25)',
                padding: '5px 14px', cursor: cargando ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {cargando ? '...' : '✗ No podré'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventoHistorial({ ev }) {
  const color = TIPO_COLOR[ev.tipo] || '#666';
  return (
    <div style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid #111', alignItems: 'center' }}>
      <FechaBox fecha={ev.fecha} color={color} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem', fontWeight: 600, color: '#ccc' }}>{ev.titulo}</span>
          <TipoBadge tipo={ev.tipo} label={ev.tipo_display} color={color} />
        </div>
        <div style={{ fontSize: '0.78rem', color: '#555' }}>
          {ev.lugar && <span>{ev.lugar}</span>}
          {ev.estado !== 'realizado' && <span style={{ marginLeft: 8, color: '#cc2222' }}>· {ev.estado_display}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', minWidth: 80 }}>
        {ev.asistio === true  && <span style={{ color: '#52a852', fontSize: '0.82rem', fontWeight: 600 }}>✓ Asistió</span>}
        {ev.asistio === false && <span style={{ color: '#cc2222', fontSize: '0.82rem', fontWeight: 600 }}>✗ No asistió</span>}
        {ev.asistio === null  && <span style={{ color: '#555', fontSize: '0.82rem' }}>—</span>}
      </div>
    </div>
  );
}

function FechaBox({ fecha, color }) {
  const d = new Date(fecha + 'T12:00:00');
  return (
    <div style={{
      minWidth: 44, textAlign: 'center', background: '#0d0d0d',
      border: `1px solid ${color}44`, padding: '6px 4px', flexShrink: 0,
    }}>
      <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.1rem', fontWeight: 700, color, lineHeight: 1 }}>
        {d.getDate()}
      </div>
      <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555' }}>
        {d.toLocaleDateString('es-CL', { month: 'short' })}
      </div>
    </div>
  );
}

function TipoBadge({ tipo, label, color }) {
  return (
    <span style={{
      background: color + '1a', color, border: `1px solid ${color}33`,
      padding: '1px 6px', fontSize: '0.68rem', fontWeight: 600,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
}

const btnGhostStyle = {
  fontFamily: 'Rajdhani, sans-serif', fontSize: '0.78rem', fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  background: 'none', border: '1px solid #2a2a2a', color: '#666',
  padding: '4px 10px', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
};
