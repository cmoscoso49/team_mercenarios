import axios from 'axios'

export const loginApi = (username, password) =>
  axios.post('/api/v1/auth/login/', { username, password })

export const getMeApi = (token) =>
  axios.get('/api/v1/auth/me/', {
    headers: { Authorization: `Bearer ${token}` },
  })
