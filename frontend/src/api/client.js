import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('tm_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('tm_refresh_token')
      if (refresh) {
        try {
          const res = await axios.post('/api/v1/auth/token/refresh/', { refresh })
          const newAccess = res.data.access
          localStorage.setItem('tm_access_token', newAccess)
          original.headers.Authorization = `Bearer ${newAccess}`
          return client(original)
        } catch {
          localStorage.removeItem('tm_access_token')
          localStorage.removeItem('tm_refresh_token')
          window.location.href = '/login'
        }
      } else {
        localStorage.removeItem('tm_access_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
