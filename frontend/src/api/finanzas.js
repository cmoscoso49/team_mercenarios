import client from './client'

export const getResumenFinanciero = () => client.get('/finanzas/resumen/')
export const getMovimientos = (params) => client.get('/finanzas/movimientos/', { params })
export const createMovimiento = (data) => client.post('/finanzas/movimientos/', data)
export const updateMovimiento = (id, data) => client.put(`/finanzas/movimientos/${id}/`, data)
export const deleteMovimiento = (id) => client.delete(`/finanzas/movimientos/${id}/`)

export const getMensualidades = (params) => client.get('/finanzas/mensualidades/', { params })
export const createMensualidad = (data) => client.post('/finanzas/mensualidades/', data)
export const updateMensualidad = (id, data) => client.put(`/finanzas/mensualidades/${id}/`, data)

export const getDeudas = (params) => client.get('/finanzas/deudas/', { params })
export const createDeuda = (data) => client.post('/finanzas/deudas/', data)
export const updateDeuda = (id, data) => client.put(`/finanzas/deudas/${id}/`, data)
export const deleteDeuda = (id) => client.delete(`/finanzas/deudas/${id}/`)

export const getCategorias = () => client.get('/finanzas/categorias/')
export const createCategoria = (data) => client.post('/finanzas/categorias/', data)

export const importarExcel = (formData) =>
  client.post('/importacion/excel/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getCuentasBanco = () => client.get('/finanzas/cuentas/')

export const importarExtractoBanco = (formData) =>
  client.post('/finanzas/banco/importar/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getExtractoBanco = (params) =>
  client.get('/finanzas/banco/extracto/', { params })
