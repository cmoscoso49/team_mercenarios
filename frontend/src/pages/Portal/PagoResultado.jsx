import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MAX_INTENTOS = 45; // 45 × 2 seg = 90 seg

export default function PagoResultado() {
  const [fase, setFase] = useState('polling'); // polling | completado | fallido | timeout
  const [pago, setPago] = useState(null);
  const [intento, setIntento] = useState(0);

  const ordenId = sessionStorage.getItem('tm_pago_orden_id');

  useEffect(() => {
    if (!ordenId) {
      setFase('timeout');
      return;
    }

    let cancelled = false;
    let intentos = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await apiClient.get(`/portal/pagos/${ordenId}/estado/`);
        const p = res.data;
        if (cancelled) return;

        setIntento(i => i + 1);

        if (p.estado === 'completado') {
          sessionStorage.removeItem('tm_pago_orden_id');
          setPago(p);
          setFase('completado');
        } else if (['fallido', 'cancelado', 'expirado'].includes(p.estado)) {
          sessionStorage.removeItem('tm_pago_orden_id');
          setPago(p);
          setFase('fallido');
        } else {
          intentos++;
          if (intentos >= MAX_INTENTOS) {
            setFase('timeout');
          } else {
            setTimeout(poll, 2000);
          }
        }
      } catch {
        intentos++;
        if (intentos >= MAX_INTENTOS) {
          setFase('timeout');
        } else {
          setTimeout(poll, 2000);
        }
      }
    };

    // Espera 1s antes del primer intento (Flow necesita tiempo para procesar)
    setTimeout(poll, 1000);

    return () => { cancelled = true; };
  }, [ordenId]);

  return (
    <>
      <div className="portal-page-header">
        <span className="portal-page-tag">// Pago</span>
        <h1 className="portal-page-title">Resultado del Pago</h1>
      </div>

      {/* POLLING */}
      {fase === 'polling' && (
        <div className="portal-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            width: 40, height: 40, margin: '0 auto 20px',
            border: '2px solid #2a1e1e',
            borderTopColor: '#cc2222',
            borderRadius: '50%',
            animation: 'tm-spin 0.75s linear infinite',
          }} />
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Verificando tu pago
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>
            Confirmando con Flow... intento {intento + 1}/{MAX_INTENTOS}
          </div>
        </div>
      )}

      {/* COMPLETADO */}
      {fase === 'completado' && pago && (
        <div className="portal-card" style={{ border: '1px solid rgba(61,122,61,0.4)', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 20px',
            background: 'rgba(22,163,74,0.15)',
            border: '2px solid rgba(22,163,74,0.5)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: '#3fb950',
          }}>✓</div>

          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#3fb950', marginBottom: 6 }}>
            ¡Pago Confirmado!
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: 28, color: '#ffffff', marginBottom: 20 }}>
            ${Number(pago.monto).toLocaleString('es-CL')} CLP
          </div>

          {pago.mensualidades_detalle?.length > 0 && (
            <div style={{ maxWidth: 320, margin: '0 auto 24px', textAlign: 'left' }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                Cuotas pagadas
              </div>
              {pago.mensualidades_detalle.map(m => (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 10px',
                  marginBottom: 4,
                  background: 'rgba(22,163,74,0.06)',
                  border: '1px solid rgba(22,163,74,0.2)',
                }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {MESES[m.mes]} {m.anio}
                  </span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: '#3fb950' }}>
                    ${Number(m.monto).toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 24 }}>
            Orden: {pago.orden_id} · {pago.fecha_confirmacion ? new Date(pago.fecha_confirmacion).toLocaleString('es-CL') : ''}
          </div>

          <Link to="/portal/mis-cuotas" style={{
            display: 'inline-block',
            background: '#cc2222', color: '#fff',
            fontFamily: 'Oswald, sans-serif', fontSize: 12,
            fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
            padding: '9px 22px', textDecoration: 'none',
          }}>
            Ver mis cuotas
          </Link>
        </div>
      )}

      {/* FALLIDO */}
      {fase === 'fallido' && (
        <div className="portal-card" style={{ border: '1px solid rgba(204,34,34,0.35)', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 20px',
            background: 'rgba(204,34,34,0.12)',
            border: '2px solid rgba(204,34,34,0.4)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#ef4444',
          }}>✗</div>

          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#ef4444', marginBottom: 8 }}>
            Pago no completado
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            El pago fue {pago?.estado_display?.toLowerCase() || 'rechazado'}. No se realizó ningún cargo.
          </div>

          <Link to="/portal/mis-cuotas" style={{
            display: 'inline-block',
            background: 'transparent', color: 'var(--text-secondary)',
            fontFamily: 'Oswald, sans-serif', fontSize: 12,
            fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
            padding: '9px 22px', textDecoration: 'none',
            border: '1px solid var(--border-color)',
          }}>
            Volver a Mis Cuotas
          </Link>
        </div>
      )}

      {/* TIMEOUT — pago todavía pendiente */}
      {fase === 'timeout' && (
        <div className="portal-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 20px',
            background: 'rgba(184,149,42,0.1)',
            border: '2px solid rgba(184,149,42,0.4)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#d4a030',
          }}>⏱</div>

          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#d4a030', marginBottom: 8 }}>
            Verificación en proceso
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.6 }}>
            La confirmación de Flow puede tardar unos minutos.
            Revisa el estado de tus cuotas en unos instantes.
          </div>

          <Link to="/portal/mis-cuotas" style={{
            display: 'inline-block',
            background: '#cc2222', color: '#fff',
            fontFamily: 'Oswald, sans-serif', fontSize: 12,
            fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
            padding: '9px 22px', textDecoration: 'none',
          }}>
            Ir a Mis Cuotas
          </Link>
        </div>
      )}
    </>
  );
}
