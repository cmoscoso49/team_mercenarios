import client from './client'

export const getPermisos  = ()       => client.get('/admin/permisos/')
export const savePermisos = (cambios) => client.put('/admin/permisos/', cambios)
