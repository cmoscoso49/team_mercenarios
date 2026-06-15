import { useState, useEffect, useRef } from 'react'
import { getCuentasBanco, importarExtractoBanco, getExtractoBanco } from '../../api/finanzas'

const ESTADO_BADGE = {
  sin_conciliar: { label: 'Sin conciliar', cls: 'badge badge-yellow' },
  conciliado:    { label: 'Conciliado',    cls: 'badge badge-green'  },
  ignorado:      { label: 'Ignorado',      cls: 'badge badge-gray'   },
}

function fmt(n) {
  if (n == null) return '—'
  return '$' + Number(n).toLocaleString('es-CL')
}

export default function BancoTab() {
  const [cuentas, setCuentas]         = useState([])
  const [cuentaId, setCuentaId]       = useState('')
  const [extracto, setExtracto]       = useState(null)
  const [loading, setLoading]         = useState(false)
  const [importing, setImporting]     = useState(false)
  const [resultado, setResultado]     = useState(null)
  const [error, setError]             = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [modo, setModo]               = useState('archivo')  // 'archivo' | 'texto'
  const [textoPegado, setTextoPegado] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    getCuentasBanco().then(r => {
      const lista = r.data.results || r.data
      setCuentas(lista)
      if (lista.length > 0) setCuentaId(lista[0].id)
    })
  }, [])

  useEffect(() => {
    if (!cuentaId) return
    cargarExtracto()
  }, [cuentaId, estadoFiltro])

  function cargarExtracto() {
    setLoading(true)
    const params = { cuenta_id: cuentaId }
    if (estadoFiltro) params.estado = estadoFiltro
    getExtractoBanco(params)
      .then(r => setExtracto(r.data))
      .catch(() => setError('Error al cargar extracto.'))
      .finally(() => setLoading(false))
  }

  async function handleImportar(e) {
    e.preventDefault()
    if (!cuentaId) { setError('Selecciona una cuenta.'); return }

    const fd = new FormData()
    fd.append('cuenta_id', cuentaId)

    if (modo === 'archivo') {
      const archivo = fileRef.current?.files?.[0]
      if (!archivo) { setError('Selecciona un archivo.'); return }
      fd.append('archivo', archivo)
    } else {
      if (!textoPegado.trim()) { setError('Pega el texto de los movimientos.'); return }
      fd.append('texto', textoPegado)
    }

    setError('')
    setResultado(null)
    setImporting(true)

    try {
      const r = await importarExtractoBanco(fd)
      setResultado(r.data)
      if (fileRef.current) fileRef.current.value = ''
      setTextoPegado('')
      cargarExtracto()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar.')
    } finally {
      setImporting(false)
    }
  }

  const saldoActual = extracto?.results?.find(r => r.saldo != null)?.saldo

  return (
    <div>
      {/* Aviso COOPEUCH */}
      <div style={{
        background: 'rgba(184,149,42,0.07)', border: '1px solid rgba(184,149,42,0.25)',
        borderLeft: '3px solid #b8952a', padding: '10px 14px', marginBottom: 16,
        fontSize: 12, color: '#b8952a', lineHeight: 1.6,
      }}>
        <strong>COOPEUCH:</strong> El portal solo muestra movimientos de 2026.
        Para datos anteriores solicita el estado de cuenta en tu sucursal.
        Puedes importar el PDF del portal o copiar y pegar la tabla directamente.
      </div>

      {/* Panel importación */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            className={`btn btn-sm ${modo === 'archivo' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setModo('archivo')}
          >
            Subir archivo
          </button>
          <button
            className={`btn btn-sm ${modo === 'texto' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setModo('texto')}
          >
            Pegar tabla
          </button>
        </div>

        <form onSubmit={handleImportar}>
          {/* Selector de cuenta siempre visible */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 0, flex: '0 0 200px' }}>
              <label className="form-label">Cuenta bancaria</label>
              <select
                className="form-control"
                value={cuentaId}
                onChange={e => setCuentaId(e.target.value)}
              >
                {cuentas.length === 0 && <option value="">Sin cuentas registradas</option>}
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.banco}</option>)}
              </select>
            </div>

            {modo === 'archivo' && (
              <div className="form-group" style={{ marginBottom: 0, flex: '1 1 240px' }}>
                <label className="form-label">Archivo (.pdf, .xlsx, .csv)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv,.txt"
                  className="form-control"
                  style={{ paddingTop: 6 }}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={importing || !cuentaId}
              style={{ height: 38, alignSelf: 'flex-end' }}
            >
              {importing ? 'Procesando…' : modo === 'archivo' ? 'Importar' : 'Procesar texto'}
            </button>
          </div>

          {modo === 'texto' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Pegar tabla — Selecciona los movimientos en COOPEUCH (Ctrl+A en la tabla → Ctrl+C) y pégalos aquí
              </label>
              <textarea
                className="form-control"
                rows={8}
                value={textoPegado}
                onChange={e => setTextoPegado(e.target.value)}
                placeholder={"Fecha\tDescripción\tMonto\tSaldo\n07/06/2026\tTRANSFERENCIA...\t5.000\t315.176"}
                style={{ fontFamily: 'monospace', fontSize: 11, resize: 'vertical' }}
              />
            </div>
          )}
        </form>

        {/* Instrucciones PDF */}
        {modo === 'archivo' && (
          <p style={{ marginTop: 10, fontSize: 11, color: '#555', lineHeight: 1.7 }}>
            En COOPEUCH Online → Mis Productos → Cuenta Vista → Movimientos → clic en{' '}
            <span style={{ color: '#cc2222', fontWeight: 600 }}>↓</span> (ícono rojo junto a "Historial de movimientos") → descarga PDF → súbelo aquí.
          </p>
        )}

        {error && <div className="error-msg" style={{ marginTop: 10 }}>{error}</div>}

        {resultado && (
          <div style={{
            marginTop: 10, padding: '10px 14px',
            background: 'rgba(61,122,61,0.08)', border: '1px solid rgba(61,122,61,0.25)',
            fontSize: 13, color: '#52a852',
          }}>
            ✓ {resultado.nuevos} transacciones importadas
            {resultado.duplicados > 0 && `, ${resultado.duplicados} duplicadas omitidas`}
            {resultado.total_archivo > 0 && ` (${resultado.total_archivo} en el archivo)`}
          </div>
        )}
      </div>

      {/* KPIs */}
      {extracto && extracto.count > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Total abonos',    value: fmt(extracto.total_abonos), color: '#52a852' },
            { label: 'Total cargos',    value: fmt(extracto.total_cargos), color: '#e05555' },
            { label: 'Último saldo',    value: fmt(saldoActual),           color: '#d0d0d0' },
            { label: 'Transacciones',   value: extracto.count,             color: '#cc2222' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: '#131313', border: '1px solid #1e1e1e',
              padding: '14px 20px', minWidth: 130, flex: '1 1 130px',
            }}>
              <span style={{ display: 'block', fontFamily: 'Oswald,sans-serif', fontSize: '1.3rem', fontWeight: 700, color, lineHeight: 1 }}>
                {value}
              </span>
              <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="filters-row" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>Estado:</span>
        {[['', 'Todos'], ['sin_conciliar', 'Sin conciliar'], ['conciliado', 'Conciliado'], ['ignorado', 'Ignorado']].map(([v, l]) => (
          <button
            key={v}
            className={`btn btn-sm ${estadoFiltro === v ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setEstadoFiltro(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loading">Cargando extracto…</div>
      ) : !extracto || extracto.results.length === 0 ? (
        <div className="empty-state">
          No hay movimientos bancarios importados.
          {cuentas.length === 0 && (
            <span style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#444' }}>
              Primero crea una cuenta bancaria en el admin Django o contacta al administrador.
            </span>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th style={{ textAlign: 'right' }}>Cargo</th>
                <th style={{ textAlign: 'right' }}>Abono</th>
                <th style={{ textAlign: 'right' }}>Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {extracto.results.map(row => (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{row.fecha}</td>
                  <td style={{ maxWidth: 300, fontSize: 12 }}>{row.descripcion}</td>
                  <td style={{ textAlign: 'right', color: '#e05555', fontFamily: 'monospace', fontSize: 12 }}>
                    {row.cargo ? fmt(row.cargo) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', color: '#52a852', fontFamily: 'monospace', fontSize: 12 }}>
                    {row.abono ? fmt(row.abono) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: '#777' }}>
                    {fmt(row.saldo)}
                  </td>
                  <td>
                    <span className={ESTADO_BADGE[row.estado_conciliacion]?.cls || 'badge badge-gray'}>
                      {ESTADO_BADGE[row.estado_conciliacion]?.label || row.estado_conciliacion}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {extracto.count > extracto.page_size && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#444', marginTop: 12 }}>
              Mostrando {Math.min(extracto.page_size, extracto.results.length)} de {extracto.count} transacciones
            </p>
          )}
        </div>
      )}
    </div>
  )
}
