import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import './Postulacion.css';

const INITIAL = {
  nombre: '', edad: '', ciudad: '', telefono: '', email: '',
  nick: '', experiencia: '', tiene_equipo: false,
  como_conocio: '', mensaje: '',
};

export default function Postulacion() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState('');

  function handle(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setGlobalError('');
    setErrors({});
    try {
      await client.post('/public/postulacion/', {
        ...form,
        edad: Number(form.edad),
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') {
        const data = err.response.data;
        if (data.mensaje) {
          setGlobalError(data.mensaje);
        } else {
          const fieldErrors = {};
          Object.entries(data).forEach(([k, v]) => {
            fieldErrors[k] = Array.isArray(v) ? v.join(' ') : v;
          });
          setErrors(fieldErrors);
        }
      } else {
        setGlobalError('Error al enviar. Intenta nuevamente.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="post-page">
      <nav className="post-nav">
        <div className="post-nav-inner">
          <Link to="/inicio" className="post-nav-brand">Team Mercenarios</Link>
          <Link to="/inicio" className="post-nav-back">← Volver al inicio</Link>
        </div>
      </nav>

      {success ? (
        <div className="post-main">
          <div className="post-success">
            <div className="post-success-icon">◈</div>
            <h2>Postulación Recibida</h2>
            <p>
              Gracias por tu interés en Team Mercenarios. Revisaremos tu solicitud
              y te contactaremos al teléfono o email proporcionado.
            </p>
            <Link to="/inicio" className="post-btn-submit" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Volver al Inicio
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="post-hero">
            <div className="post-hero-tag">Reclutamiento</div>
            <h1>Únete al <span>Team</span></h1>
            <p>
              Completa el formulario para postular. Evaluamos a cada candidato
              individualmente. Solo contáctate si cumples los requisitos básicos.
            </p>
          </div>

          <div className="post-main">
            <div className="post-card">
              {globalError && <div className="post-error-global">{globalError}</div>}
              <form onSubmit={submit} noValidate>

                <div className="post-section-title">Datos personales</div>
                <div className="post-grid">
                  <div className="post-field">
                    <label>Nombre completo <span className="req">*</span></label>
                    <input name="nombre" value={form.nombre} onChange={handle} required maxLength={100} placeholder="Tu nombre real" />
                    {errors.nombre && <span className="post-field-error">{errors.nombre}</span>}
                  </div>
                  <div className="post-field">
                    <label>Nick / Alias</label>
                    <input name="nick" value={form.nick} onChange={handle} maxLength={60} placeholder="Tu nick de Airsoft" />
                    {errors.nick && <span className="post-field-error">{errors.nick}</span>}
                  </div>
                  <div className="post-field">
                    <label>Edad <span className="req">*</span></label>
                    <input name="edad" type="number" value={form.edad} onChange={handle} required min={14} max={70} placeholder="Ej: 24" />
                    {errors.edad && <span className="post-field-error">{errors.edad}</span>}
                  </div>
                  <div className="post-field">
                    <label>Ciudad <span className="req">*</span></label>
                    <input name="ciudad" value={form.ciudad} onChange={handle} required maxLength={80} placeholder="Ej: Arica" />
                    {errors.ciudad && <span className="post-field-error">{errors.ciudad}</span>}
                  </div>
                  <div className="post-field">
                    <label>Teléfono <span className="req">*</span></label>
                    <input name="telefono" value={form.telefono} onChange={handle} required maxLength={20} placeholder="+56 9 XXXX XXXX" />
                    {errors.telefono && <span className="post-field-error">{errors.telefono}</span>}
                  </div>
                  <div className="post-field">
                    <label>Email <span className="req">*</span></label>
                    <input name="email" type="email" value={form.email} onChange={handle} required placeholder="tu@email.com" />
                    {errors.email && <span className="post-field-error">{errors.email}</span>}
                  </div>
                </div>

                <div className="post-section-title">Experiencia en Airsoft</div>
                <div className="post-grid">
                  <div className="post-field full">
                    <label>Cuéntanos tu experiencia</label>
                    <textarea name="experiencia" value={form.experiencia} onChange={handle} placeholder="¿Cuánto tiempo llevas jugando? ¿Equipo actual? ¿Estilo de juego?" />
                    {errors.experiencia && <span className="post-field-error">{errors.experiencia}</span>}
                  </div>
                  <div className="post-field full">
                    <label className="post-check-wrap" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="tiene_equipo"
                        checked={form.tiene_equipo}
                        onChange={handle}
                      />
                      <span className="post-check-label">Cuento con equipo propio (réplica + protecciones)</span>
                    </label>
                  </div>
                </div>

                <div className="post-section-title">Mensaje adicional</div>
                <div className="post-grid">
                  <div className="post-field">
                    <label>¿Cómo conociste el team?</label>
                    <select name="como_conocio" value={form.como_conocio} onChange={handle}>
                      <option value="">— Selecciona —</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="amigo">Un amigo o conocido</option>
                      <option value="evento">En un evento de Airsoft</option>
                      <option value="internet">Búsqueda en internet</option>
                      <option value="otro">Otro</option>
                    </select>
                    {errors.como_conocio && <span className="post-field-error">{errors.como_conocio}</span>}
                  </div>
                  <div className="post-field">
                    <label>Mensaje</label>
                    <textarea name="mensaje" value={form.mensaje} onChange={handle} placeholder="¿Algo más que quieras decirnos?" style={{ minHeight: '70px' }} />
                    {errors.mensaje && <span className="post-field-error">{errors.mensaje}</span>}
                  </div>
                </div>

                <div className="post-submit-wrap">
                  <span className="post-submit-note">* Campos obligatorios</span>
                  <button type="submit" className="post-btn-submit" disabled={sending}>
                    {sending ? 'Enviando...' : 'Enviar Postulación →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <footer className="post-footer">
        © {new Date().getFullYear()} Team Mercenarios — Arica, Chile
      </footer>
    </div>
  );
}
