import { useState } from 'react';
import apiClient from '../../api/client';
import { useToast } from '../../components/common/ToastProvider';

const INITIAL = { password_actual: '', password_nuevo: '', password_confirmar: '' };

export default function CambiarPassword() {
  const [form, setForm]       = useState(INITIAL);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const toast = useToast();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.password_actual)    e.password_actual    = 'Ingresa tu contraseña actual.';
    if (!form.password_nuevo)     e.password_nuevo     = 'Ingresa la nueva contraseña.';
    else if (form.password_nuevo.length < 8) e.password_nuevo = 'Mínimo 8 caracteres.';
    if (!form.password_confirmar) e.password_confirmar = 'Confirma la nueva contraseña.';
    else if (form.password_nuevo && form.password_nuevo !== form.password_confirmar)
      e.password_confirmar = 'Las contraseñas no coinciden.';
    if (form.password_actual && form.password_nuevo && form.password_actual === form.password_nuevo)
      e.password_nuevo = 'La nueva contraseña debe ser diferente a la actual.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const res = await apiClient.post('/portal/cambiar-password/', form);
      toast.success(res.data.detail || 'Tu contraseña fue actualizada correctamente.');
      setForm(INITIAL);
      setErrors({});
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al cambiar la contraseña.';
      // El error del backend indica qué campo falló
      if (msg.toLowerCase().includes('actual'))
        setErrors({ password_actual: msg });
      else if (msg.toLowerCase().includes('coincid'))
        setErrors({ password_confirmar: msg });
      else
        toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="portal-page-header">
        <span className="portal-page-tag">// Mi Perfil</span>
        <h1 className="portal-page-title">Cambiar Contraseña</h1>
      </div>

      <div className="portal-card" style={{ maxWidth: 480 }}>
        <div className="portal-card-title">Nueva contraseña</div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <Field
            label="Contraseña actual"
            name="password_actual"
            value={form.password_actual}
            onChange={handleChange}
            error={errors.password_actual}
            autoComplete="current-password"
          />
          <Field
            label="Nueva contraseña"
            name="password_nuevo"
            value={form.password_nuevo}
            onChange={handleChange}
            error={errors.password_nuevo}
            autoComplete="new-password"
            hint="Mínimo 8 caracteres."
          />
          <Field
            label="Confirmar nueva contraseña"
            name="password_confirmar"
            value={form.password_confirmar}
            onChange={handleChange}
            error={errors.password_confirmar}
            autoComplete="new-password"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: saving ? 'var(--bg-hover)' : '#cc2222',
                color: saving ? 'var(--text-muted)' : '#fff',
                border: 'none',
                padding: '10px 32px',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {saving ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function Field({ label, name, value, onChange, error, hint, autoComplete }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block',
        fontFamily: 'Oswald, sans-serif',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.14em',
        color: error ? '#cc2222' : 'var(--text-muted)',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          background: 'var(--bg-input)',
          border: `1px solid ${error ? '#cc2222' : 'var(--border-color)'}`,
          color: 'var(--text-primary)',
          padding: '10px 12px',
          fontFamily: 'var(--font)',
          fontSize: '0.95rem',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = '#3d7a3d'; }}
        onBlur={e => { if (!error) e.target.style.borderColor = 'var(--border-color)'; }}
      />
      {error && (
        <span style={{ color: '#cc2222', fontSize: '0.78rem', fontFamily: 'var(--font)', marginTop: 4, display: 'block' }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font)', marginTop: 4, display: 'block' }}>
          {hint}
        </span>
      )}
    </div>
  );
}
