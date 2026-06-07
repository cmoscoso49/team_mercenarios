import client from './client'

export const getAlbums = (params) => client.get('/galeria/albums/', { params })
export const getAlbum = (id) => client.get(`/galeria/albums/${id}/`)
export const createAlbum = (data) => client.post('/galeria/albums/', data)
export const updateAlbum = (id, data) => client.put(`/galeria/albums/${id}/`, data)
export const deleteAlbum = (id) => client.delete(`/galeria/albums/${id}/`)

export const getFotos = (params) => client.get('/galeria/fotos/', { params })
export const uploadFoto = (formData) =>
  client.post('/galeria/fotos/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const deleteFoto = (id) => client.delete(`/galeria/fotos/${id}/`)
