import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ToastProvider from './components/common/ToastProvider'
import ConfirmProvider from './components/common/ConfirmModal'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import NoticiaPublica from './pages/Home/NoticiaPublica'
import EventoPublico from './pages/Home/EventoPublico'
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
import Postulacion from './pages/Postulacion/Postulacion'
import Postulaciones from './pages/Admin/Postulaciones'
import PortalLayout from './pages/Portal/PortalLayout'
import PortalDashboard from './pages/Portal/PortalDashboard'
import MisCuotas from './pages/Portal/MisCuotas'
import MisEventos from './pages/Portal/MisEventos'
import MiPerfil from './pages/Portal/MiPerfil'
import CambiarPassword from './pages/Portal/CambiarPassword'
import PagoResultado from './pages/Portal/PagoResultado'
import MisPagos from './pages/Portal/MisPagos'
import Instagram from './pages/Instagram/Instagram'
import InstagramForm from './pages/Instagram/InstagramForm'
import Permisos from './pages/Admin/Permisos'

function PortalRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#080808', color: '#cc2222',
      fontSize: 14, fontFamily: "'Oswald', sans-serif",
      letterSpacing: 4, textTransform: 'uppercase'
    }}>
      Cargando...
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

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
      <Route path="/noticias/:id"   element={<NoticiaPublica />} />
      <Route path="/eventos/:id"    element={<EventoPublico />} />
      <Route path="/postulacion"    element={<Postulacion />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/portal" element={<PortalRoute><PortalLayout /></PortalRoute>}>
        <Route index element={<PortalDashboard />} />
        <Route path="mis-cuotas"  element={<MisCuotas />} />
        <Route path="mis-eventos" element={<MisEventos />} />
        <Route path="mi-perfil"        element={<MiPerfil />} />
        <Route path="cambiar-password" element={<CambiarPassword />} />
        <Route path="mis-pagos"        element={<MisPagos />} />
        <Route path="pago-resultado"   element={<PagoResultado />} />
      </Route>
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
        <Route path="instagram" element={<Instagram />} />
        <Route path="instagram/nueva" element={<InstagramForm />} />
        <Route path="instagram/:id/editar" element={<InstagramForm />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="postulaciones" element={<Postulaciones />} />
        <Route path="permisos" element={<Permisos />} />
      </Route>
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
