import client from './client'

export const getDashboard = () => client.get('/dashboard/')
export const getReporteFinanciero = (params) => client.get('/reportes/financiero/', { params })
export const getReporteIntegrantes = (params) => client.get('/reportes/integrantes/', { params })
export const getReporteParticipaciones = (params) => client.get('/reportes/participaciones/', { params })
export const getReporteConciliacion = () => client.get('/reportes/conciliacion/')
