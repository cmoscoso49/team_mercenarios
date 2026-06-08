import client from './client'

export const getIntegrantes = (params) => client.get('/integrantes/', { params })
export const getIntegrante = (id) => client.get(`/integrantes/${id}/`)
export const createIntegrante = (data) => client.post('/integrantes/', data)
export const updateIntegrante = (id, data) => client.put(`/integrantes/${id}/`, data)
export const darDeBaja = (id) => client.patch(`/integrantes/${id}/dar-de-baja/`)
export const reactivarIntegrante = (id) => client.patch(`/integrantes/${id}/reactivar/`)
export const getMensualidadesIntegrante = (id) => client.get(`/integrantes/${id}/mensualidades/`)
export const getParticipacionesIntegrante = (id) => client.get(`/integrantes/${id}/participaciones/`)
export const getDeudasIntegrante = (id) => client.get(`/integrantes/${id}/deudas/`)
export const getResumenIntegrante = (id) => client.get(`/integrantes/${id}/resumen/`)
export const patchMensualidad = (mensualidadId, data) => client.patch(`/finanzas/mensualidades/${mensualidadId}/`, data)
