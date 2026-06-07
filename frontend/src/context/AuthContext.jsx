import React, { createContext, useContext, useState, useEffect } from 'react'
import { loginApi, getMeApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tm_access_token')
    if (token) {
      getMeApi(token)
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('tm_access_token')
          localStorage.removeItem('tm_refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const res = await loginApi(username, password)
    const { access, refresh, user: userData } = res.data
    localStorage.setItem('tm_access_token', access)
    localStorage.setItem('tm_refresh_token', refresh)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('tm_access_token')
    localStorage.removeItem('tm_refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
