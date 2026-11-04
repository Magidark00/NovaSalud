import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import './Badge.css'

const ESTADOS = {
  normal: { texto: 'Normal', tono: 'success', Icono: CircleCheck },
  bajo: { texto: 'Stock bajo', tono: 'warning', Icono: TriangleAlert },
  porVencer: { texto: 'Por vencer', tono: 'warning', Icono: TriangleAlert },
  agotado: { texto: 'Agotado', tono: 'danger', Icono: CircleX },
  recibida: { texto: 'Recibida', tono: 'success', Icono: CircleCheck },
  pendiente: { texto: 'Pendiente', tono: 'warning', Icono: TriangleAlert },
}

// estado: 'normal' | 'bajo' | 'porVencer' | 'agotado' | 'recibida' | 'pendiente'
export default function Badge({ estado }) {
  const config = ESTADOS[estado]
  if (!config) return null
  const { texto, tono, Icono } = config

  return (
    <span className={`badge badge--${tono}`}>
      <Icono size={13} aria-hidden="true" />
      {texto}
    </span>
  )
}
