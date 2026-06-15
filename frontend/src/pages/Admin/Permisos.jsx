import React, { useEffect, useState } from 'react'
import { getPermisos, savePermisos } from '../../api/permisos'
import { useToast } from '../../components/common/ToastProvider'
import '../../components/common/common.css'

const ICONO_MODULO = {
  dashboard:     '◈',
  integrantes:   '◉',
  finanzas:      '◆',
  reportes:      '▦',
  eventos:       '◎',
  noticias:      '▣',
  instagram:     '◉',
  reclutamiento: '◈',
}

export default function Permisos() {
  const toast = useToast()
  const [filas, setFilas]   = useState([])
  const [roles, setRoles]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [dirty, setDirty]     = useState(false)

  useEffect(() => {
    getPermisos()
      .then(r => {
        setFilas(r.data.permisos)
        setRoles(r.data.roles.filter(r => r.rol !== 'admin'))
      })
      .finally(() => setLoading(false))
  }, [])

  const toggle = (moduloIdx, rol, campo) => {
    setFilas(prev => {
      const next = prev.map((f, i) => {
        if (i !== moduloIdx) return f
        const rolData = { ...f.roles[rol], [campo]: !f.roles[rol][campo] }
        // si desmarca puede_ver también desmarca puede_editar
        if (campo === 'puede_ver' && !rolData.puede_ver) rolData.puede_editar = false
        // si marca puede_editar también marca puede_ver
        if (campo === 'puede_editar' && rolData.puede_editar) rolData.puede_ver = true
        return { ...f, roles: { ...f.roles, [rol]: rolData } }
      })
      return next
    })
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const cambios = []
    for (const fila of filas) {
      for (const [rol, data] of Object.entries(fila.roles)) {
        if (data.bloqueado) continue
        cambios.push({
          modulo:       fila.modulo,
          rol,
          puede_ver:    data.puede_ver,
          puede_editar: data.puede_editar,
        })
      }
    }
    try {
      await savePermisos(cambios)
      toast.success('Permisos guardados. Los cambios aplican en máx. 15 minutos.')
      setDirty(false)
    } catch {
      toast.error('Error al guardar permisos.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Cargando permisos...</div>

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Gestión de Permisos</h2>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {dirty && (
        <div style={{
          padding: '8px 14px', marginBottom: 16, fontSize: 12,
          background: 'rgba(204,34,34,0.1)', border: '1px solid rgba(204,34,34,0.3)',
          borderRadius: 2, color: '#cc8888',
        }}>
          Tienes cambios sin guardar. Los permisos se aplican al guardar (caché de 15 min).
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0d0d0d' }}>
              <th style={thStyle}>Módulo</th>
              <th style={{ ...thStyle, color: 'var(--text-muted)', minWidth: 80, textAlign: 'center' }}>
                admin<br /><span style={{ fontSize: 9, color: '#444' }}>🔒 total</span>
              </th>
              {roles.map(r => (
                <th key={r.rol} style={{ ...thStyle, minWidth: 110, textAlign: 'center' }}>
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, fi) => (
              <tr key={fila.modulo} style={{ borderBottom: '1px solid #111' }}>
                <td style={tdStyle}>
                  <span style={{ marginRight: 8, color: 'var(--text-muted)' }}>
                    {ICONO_MODULO[fila.modulo] || '▪'}
                  </span>
                  <span style={{ fontWeight: 600 }}>{fila.label}</span>
                </td>

                {/* Columna admin — siempre bloqueada */}
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span style={{ fontSize: 16, color: 'var(--accent-light)' }}>✓</span>
                  <span style={{ fontSize: 9, display: 'block', color: '#444' }}>🔒</span>
                </td>

                {roles.map(r => {
                  const data = fila.roles[r.rol] || { puede_ver: false, puede_editar: false }
                  return (
                    <td key={r.rol} style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                        <label style={toggleLabel} title="Puede ver">
                          <input
                            type="checkbox"
                            checked={data.puede_ver}
                            onChange={() => toggle(fi, r.rol, 'puede_ver')}
                            style={{ accentColor: 'var(--accent-light)' }}
                          />
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>Ver</span>
                        </label>
                        <label style={toggleLabel} title="Puede editar">
                          <input
                            type="checkbox"
                            checked={data.puede_editar}
                            disabled={!data.puede_ver}
                            onChange={() => toggle(fi, r.rol, 'puede_editar')}
                            style={{ accentColor: '#cc2222' }}
                          />
                          <span style={{ fontSize: 10, color: data.puede_ver ? 'var(--text-muted)' : '#333', marginLeft: 4 }}>Editar</span>
                        </label>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
        <strong>Ver</strong> = acceso de lectura al módulo.
        <strong style={{ marginLeft: 12 }}>Editar</strong> = crear, modificar y eliminar (requiere Ver).
        La columna <strong style={{ marginLeft: 4 }}>admin</strong> no se puede modificar.
      </div>
    </div>
  )
}

const thStyle = {
  padding: '12px 14px',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  textAlign: 'left',
  borderBottom: '1px solid #1a1a1a',
}

const tdStyle = {
  padding: '12px 14px',
  fontSize: 13,
  verticalAlign: 'middle',
}

const toggleLabel = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
}
