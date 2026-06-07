import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';

const ESTADO_LABELS = {
  pendiente:  { label: 'Pendiente',          color: '#b8952a' },
  revisando:  { label: 'En revisión',         color: '#5588cc' },
  en_prueba:  { label: 'Partida de prueba',   color: '#8855cc' },
  aprobada:   { label: 'Aprobada',            color: '#3d7a3d' },
  rechazada:  { label: 'Rechazada',           color: '#cc2222' },
};

const ESTADOS = Object.entries(ESTADO_LABELS);

export default function Postulaciones() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [selected, setSelected] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [notasEdit, setNotasEdit] = useState('');
  const [estadoEdit, setEstadoEdit] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (busqueda) params.search = busqueda;
      const res = await apiClient.get('/reclutamiento/postulaciones/', { params });
      setItems(res.data.results ?? res.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, busqueda]);

  useEffect(() => { cargar(); }, [cargar]);

  function abrir(item) {
    setSelected(item);
    setNotasEdit(item.notas_admin || '');
    setEstadoEdit(item.estado);
  }

  async function guardar() {
    if (!selected) return;
    setGuardando(true);
    try {
      const res = await apiClient.patch(`/reclutamiento/postulaciones/${selected.id}/`, {
        estado: estadoEdit,
        notas_admin: notasEdit,
      });
      setSelected(res.data);
      setItems(prev => prev.map(i => i.id === res.data.id ? res.data : i));
    } finally {
      setGuardando(false);
    }
  }

  function cerrar() { setSelected(null); }

  const badge = (estado) => {
    const cfg = ESTADO_LABELS[estado] || { label: estado, color: '#666' };
    return (
      <span style={{
        background: cfg.color + '22',
        color: cfg.color,
        border: `1px solid ${cfg.color}44`,
        padding: '2px 8px',
        fontSize: '0.75rem',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.06em', color: '#f0f0f0', textTransform: 'uppercase', margin: 0 }}>
          // POSTULACIONES
        </h1>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', color: '#555', letterSpacing: '0.08em' }}>
          {items.length} registro{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar nombre, nick, ciudad..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            flex: '1 1 220px',
            background: '#131313', border: '1px solid #2a2a2a', color: '#d0d0d0',
            fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem',
            padding: '8px 12px', outline: 'none',
          }}
        />
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{
            background: '#131313', border: '1px solid #2a2a2a', color: '#d0d0d0',
            fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem',
            padding: '8px 12px', outline: 'none', minWidth: 160,
          }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background: '#131313', border: '1px solid #1e1e1e', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555', fontFamily: 'Rajdhani, sans-serif' }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555', fontFamily: 'Rajdhani, sans-serif' }}>Sin postulaciones.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                {['Nombre', 'Nick', 'Ciudad', 'Edad', 'Equipo', 'Estado', 'Fecha'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontFamily: 'Oswald, sans-serif', fontSize: '0.7rem',
                    fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555',
                  }}>{h}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #1a1a1a' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#181818'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '10px 14px', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem', color: '#d0d0d0' }}>{item.nombre}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem', color: '#888' }}>{item.nick || '—'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem', color: '#888' }}>{item.ciudad}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem', color: '#888', textAlign: 'center' }}>{item.edad}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{ color: item.tiene_equipo ? '#3d7a3d' : '#555', fontSize: '0.9rem' }}>
                      {item.tiene_equipo ? '✓' : '✗'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>{badge(item.estado)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.82rem', color: '#555', whiteSpace: 'nowrap' }}>
                    {new Date(item.fecha_envio).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => abrir(item)} style={{
                      background: 'none', border: '1px solid #333', color: '#888',
                      fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem',
                      fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '4px 12px', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
                    }}
                      onMouseEnter={e => { e.target.style.borderColor = '#cc2222'; e.target.style.color = '#cc2222'; }}
                      onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#888'; }}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {selected && (
        <div onClick={cerrar} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#131313', border: '1px solid #2a2a2a',
            width: '100%', maxWidth: 640, maxHeight: '90vh',
            overflowY: 'auto', padding: 32,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: '#f0f0f0', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  {selected.nombre}
                </h2>
                <div style={{ color: '#666', fontSize: '0.85rem', fontFamily: 'Rajdhani, sans-serif' }}>
                  {selected.nick && `${selected.nick} · `}
                  {selected.ciudad} · {selected.edad} años
                </div>
              </div>
              <button onClick={cerrar} style={{ background: 'none', border: 'none', color: '#555', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <InfoRow label="Teléfono" value={selected.telefono} />
            <InfoRow label="Email" value={selected.email} />
            <InfoRow label="Tiene equipo" value={selected.tiene_equipo ? 'Sí' : 'No'} />
            <InfoRow label="Cómo conoció" value={selected.como_conocio_display || selected.como_conocio || '—'} />
            {selected.experiencia && <InfoBlock label="Experiencia" value={selected.experiencia} />}
            {selected.mensaje && <InfoBlock label="Mensaje" value={selected.mensaje} />}

            <hr style={{ border: 'none', borderTop: '1px solid #1e1e1e', margin: '20px 0' }} />

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>
                Estado
              </label>
              <select value={estadoEdit} onChange={e => setEstadoEdit(e.target.value)} style={{
                background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#d0d0d0',
                fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem',
                padding: '8px 12px', outline: 'none', width: '100%',
              }}>
                {ESTADOS.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>
                Notas internas
              </label>
              <textarea value={notasEdit} onChange={e => setNotasEdit(e.target.value)}
                style={{
                  width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                  color: '#d0d0d0', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem',
                  padding: '8px 12px', outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box',
                }} placeholder="Notas privadas del administrador..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={cerrar} style={{
                background: 'none', border: '1px solid #333', color: '#888',
                fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem',
                fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '8px 20px', cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={{
                background: guardando ? '#333' : '#cc2222', border: 'none', color: '#fff',
                fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem',
                fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '8px 24px', cursor: guardando ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontFamily: 'Rajdhani, sans-serif' }}>
      <span style={{ minWidth: 120, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555' }}>{label}</span>
      <span style={{ fontSize: '0.95rem', color: '#aaa' }}>{value}</span>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div style={{ marginBottom: 12, fontFamily: 'Rajdhani, sans-serif' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '0.92rem', color: '#aaa', lineHeight: 1.5, background: '#0d0d0d', padding: '8px 12px', border: '1px solid #1a1a1a', whiteSpace: 'pre-wrap' }}>{value}</div>
    </div>
  );
}
