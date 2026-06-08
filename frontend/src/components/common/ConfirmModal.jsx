import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ConfirmContext = createContext(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx.openConfirm;
}

const OVERLAY = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 10000, padding: 16,
};
const CARD = {
  background: '#141414', border: '1px solid #2a2a2a',
  padding: '32px 28px', maxWidth: 420, width: '100%',
};

export default function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const openConfirm = useCallback(({ title, message, confirmLabel, confirmDanger, onConfirm }) => {
    setState({ title, message, confirmLabel, confirmDanger, onConfirm });
  }, []);

  function close() { setState(null); }

  function confirm() {
    if (state?.onConfirm) state.onConfirm();
    close();
  }

  useEffect(() => {
    if (!state) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state]);

  return (
    <ConfirmContext.Provider value={{ openConfirm }}>
      {children}
      {state && (
        <div style={OVERLAY} onClick={close}>
          <div style={CARD} onClick={e => e.stopPropagation()}>
            <h3 style={{
              fontFamily: 'Oswald, sans-serif', fontSize: '1.1rem', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f0f0f0',
              margin: '0 0 10px',
            }}>
              {state.title || 'Confirmar acción'}
            </h3>
            <p style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem',
              color: '#888', lineHeight: 1.5, margin: '0 0 24px',
            }}>
              {state.message || 'Esta acción no se puede deshacer.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                autoFocus
                onClick={close}
                style={{
                  fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem', fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'none', border: '1px solid #333', color: '#888',
                  padding: '8px 20px', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = '#666'; e.target.style.color = '#ccc'; }}
                onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#888'; }}
              >
                Cancelar
              </button>
              <button
                onClick={confirm}
                style={{
                  fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem', fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: state.confirmDanger !== false ? '#cc2222' : '#3d7a3d',
                  border: 'none', color: '#fff',
                  padding: '8px 24px', cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.target.style.background = state.confirmDanger !== false ? '#e63333' : '#52a852'}
                onMouseLeave={e => e.target.style.background = state.confirmDanger !== false ? '#cc2222' : '#3d7a3d'}
              >
                {state.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
