import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const client = axios.create({
  baseURL: BASE_URL,
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
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login/')) {
      original._retry = true
      const refresh = localStorage.getItem('tm_refresh_token')
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
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
