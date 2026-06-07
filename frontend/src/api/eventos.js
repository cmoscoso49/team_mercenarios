import client from './client'

export const getEventos = (params) => client.get('/eventos/', { params })
export const getEvento = (id) => client.get(`/eventos/${id}/`)
export const createEvento = (data) => client.post('/eventos/', data)
export const updateEvento = (id, data) => client.put(`/eventos/${id}/`, data)
export const deleteEvento = (id) => client.delete(`/eventos/${id}/`)
export const getProximosEventos = () => client.get('/eventos/proximos/')

export const getParticipaciones = (params) => client.get('/eventos/participaciones/', { params })
export const createParticipacion = (data) => client.post('/eventos/participaciones/', data)
export const updateParticipacion = (id, data) => client.put(`/eventos/participaciones/${id}/`, data)
export const deleteParticipacion = (id) => client.delete(`/eventos/participaciones/${id}/`)
