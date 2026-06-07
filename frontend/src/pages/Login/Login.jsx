import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logoImg from '../../assets/logo/logo_mercenarios.png'
import './Login.css'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-grid" />
      <div className="login-overlay" />

      <div className="login-card">
        <div className="login-card-accent" />

        <div className="login-header">
          <img src={logoImg} alt="Team Mercenarios" className="login-logo-img" />
          <div className="login-tag">// ÁREA DE MIEMBROS</div>
          <p className="login-subtitle">Sistema de Gestión Interno</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              className="form-control"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Ingresa tu usuario"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-control"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'VERIFICANDO...' : 'INGRESAR AL SISTEMA'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/inicio" className="login-back-link">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
