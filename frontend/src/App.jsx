import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Integrantes from './pages/Integrantes/Integrantes'
import IntegranteForm from './pages/Integrantes/IntegranteForm'
import IntegranteFicha from './pages/Integrantes/IntegranteFicha'
import Finanzas from './pages/Finanzas/Finanzas'
import Eventos from './pages/Eventos/Eventos'
import EventoForm from './pages/Eventos/EventoForm'
import Participaciones from './pages/Participaciones/Participaciones'
import Noticias from './pages/Noticias/Noticias'
import NoticiaForm from './pages/Noticias/NoticiaForm'
import Galeria from './pages/Galeria/Galeria'
import Reportes from './pages/Reportes/Reportes'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#080808', color: '#52a852',
      fontSize: 14, fontFamily: "'Oswald', sans-serif",
      letterSpacing: 4, textTransform: 'uppercase'
    }}>
      Cargando...
    </div>
  )
  return user ? children : <Navigate to="/inicio" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/inicio" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="integrantes" element={<Integrantes />} />
        <Route path="integrantes/nuevo" element={<IntegranteForm />} />
        <Route path="integrantes/:id" element={<IntegranteFicha />} />
        <Route path="integrantes/:id/editar" element={<IntegranteForm />} />
        <Route path="finanzas" element={<Finanzas />} />
        <Route path="eventos" element={<Eventos />} />
        <Route path="eventos/nuevo" element={<EventoForm />} />
        <Route path="eventos/:id/editar" element={<EventoForm />} />
        <Route path="participaciones" element={<Participaciones />} />
        <Route path="noticias" element={<Noticias />} />
        <Route path="noticias/nueva" element={<NoticiaForm />} />
        <Route path="noticias/:id/editar" element={<NoticiaForm />} />
        <Route path="galeria" element={<Galeria />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
