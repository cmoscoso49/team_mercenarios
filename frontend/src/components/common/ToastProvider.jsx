import { createContext, useContext, useState, useCallback, useRef } from 'react';
import './Toast.css';

const ICONS = { success: '✓', error: '✗', warning: '⚠', info: '◈' };
const TITLES = { success: 'Éxito', error: 'Error', warning: 'Atención', info: 'Info' };

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220);
  }, []);

  const toast = useCallback((message, type = 'success', title = null, duration = 4000) => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev.slice(-2), { id, message, type, title: title || TITLES[type], exiting: false }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((msg, title) => toast(msg, 'success', title), [toast]);
  const error   = useCallback((msg, title) => toast(msg, 'error',   title, 6000), [toast]);
  const warning = useCallback((msg, title) => toast(msg, 'warning', title), [toast]);
  const info    = useCallback((msg, title) => toast(msg, 'info',    title), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}
            onClick={() => dismiss(t.id)}
            role="alert"
          >
            <span className="toast-icon">{ICONS[t.type]}</span>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              <div className="toast-message">{t.message}</div>
            </div>
            <button className="toast-close" onClick={e => { e.stopPropagation(); dismiss(t.id); }}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
