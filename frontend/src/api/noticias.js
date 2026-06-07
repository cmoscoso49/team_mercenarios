import client from './client'

export const getNoticias = (params) => client.get('/noticias/', { params })
export const getNoticia = (id) => client.get(`/noticias/${id}/`)
export const createNoticia = (data) => client.post('/noticias/', data)
export const updateNoticia = (id, data) => client.put(`/noticias/${id}/`, data)
export const deleteNoticia = (id) => client.delete(`/noticias/${id}/`)
