import { useState, useEffect } from 'react';
import apiClient from '../../api/client';

export default function MiPerfil() {
  const [integrante, setIntegrante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noVinculado, setNoVinculado] = useState(false);
  const [form, setForm] = useState({ nick: '', telefono: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/portal/me/')
      .then(res => {
        setIntegrante(res.data);
        setForm({ nick: res.data.nick || '', telefono: res.data.telefono || '' });
        setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 404) setNoVinculado(true);
        setLoading(false);
      });
  }, []);

  function handle(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (saved) setSaved(false);
    if (error) setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiClient.patch('/portal/me/', form);
      setIntegrante(res.data);
      setSaved(true);
    } catch (err) {
      setError('Error al guardar. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="portal-loading">Cargando perfil...</div>;

  if (noVinculado) {
    return (
      <>
        <div className="portal-page-header">
          <span className="portal-page-tag">// Mi Perfil</span>
          <h1 className="portal-page-title">Perfil</h1>
        </div>
        <div className="portal-alert">Cuenta no vinculada. Contacta al administrador.</div>
      </>
    );
  }

  return (
    <>
      <div className="portal-page-header">
        <span className="portal-page-tag">// Mi Perfil</span>
        <h1 className="portal-page-title">Mi Perfil</h1>
      </div>

      <div className="portal-grid-2">
        {/* Datos de solo lectura */}
        <div className="portal-card">
          <div className="portal-card-title">Información del Team</div>
          <InfoRow label="Nombre" value={integrante?.nombre} />
          <InfoRow label="Nick" value={integrante?.nick || '—'} />
          <InfoRow label="Estado" value={integrante?.estado_display || integrante?.estado} />
          <InfoRow label="Rol en team" value={integrante?.rol_display || integrante?.rol} />
          <InfoRow label="Talla polera" value={integrante?.talla_polera || '—'} />
          <InfoRow label="Ingreso" value={integrante?.fecha_ingreso ? new Date(integrante.fecha_ingreso).toLocaleDateString('es-CL') : '—'} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12, margin: '12px 0 0' }}>
            Los campos marcados solo pueden ser modificados por el administrador.
          </p>
        </div>

        {/* Formulario editable */}
        <div className="portal-card">
          <div className="portal-card-title">Editar mis datos</div>

          {saved && (
            <div style={{ background: 'rgba(61,122,61,0.1)', border: '1px solid rgba(61,122,61,0.3)', color: '#3fb950', padding: '10px 14px', fontSize: '0.9rem', marginBottom: 16 }}>
              ✓ Datos guardados correctamente.
            </div>
          )}
          {error && (
            <div className="portal-alert" style={{ marginBottom: 16 }}>{error}</div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>
                Nick / Alias
              </label>
              <input
                name="nick"
                value={form.nick}
                onChange={handle}
                maxLength={50}
                placeholder="Tu nick de Airsoft"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  fontFamily: 'var(--font)', fontSize: '0.95rem',
                  padding: '9px 12px', outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#cc2222'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>
                Teléfono
              </label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handle}
                maxLength={20}
                placeholder="+56 9 XXXX XXXX"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  fontFamily: 'var(--font)', fontSize: '0.95rem',
                  padding: '9px 12px', outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#cc2222'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                fontFamily: 'Oswald, sans-serif', fontSize: '0.85rem', fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                background: saving ? '#333' : '#cc2222', color: '#fff',
                border: 'none', padding: '10px 28px', cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ minWidth: 100, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  );
}
