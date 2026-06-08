import client from './client'

export const loginApi = (username, password) =>
  client.post('/auth/login/', { username, password })

export const getMeApi = () =>
  client.get('/auth/me/')