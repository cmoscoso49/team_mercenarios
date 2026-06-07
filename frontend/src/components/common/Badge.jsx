import React from 'react'

const colorMap = {
  activo: 'badge-green',
  realizado: 'badge-green',
  pagada: 'badge-green',
  publicado: 'badge-green',
  inactivo: 'badge-red',
  suspendido: 'badge-red',
  cancelado: 'badge-red',
  error: 'badge-red',
  pendiente: 'badge-yellow',
  postulante: 'badge-yellow',
  borrador: 'badge-yellow',
  programado: 'badge-blue',
  lista: 'badge-blue',
  honorario: 'badge-orange',
  pos_natal: 'badge-orange',
  parcial: 'badge-orange',
  exento: 'badge-gray',
  archivado: 'badge-gray',
}

export default function Badge({ value, label }) {
  const cls = colorMap[value] || 'badge-gray'
  return <span className={`badge ${cls}`}>{label || value}</span>
}
