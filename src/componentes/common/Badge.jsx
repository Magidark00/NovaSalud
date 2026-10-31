import { CircleX, TriangleAlert } from 'lucide-react'
import './Badge.css'

const ESTADOS = {
  bajo: { texto: 'Stock bajo', tono: 'warning', Icono: TriangleAlert },
  porVencer: { texto: 'Por vencer', tono: 'warning', Icono: TriangleAlert },
  agotado: { texto: 'Agotado', tono: 'danger', Icono: CircleX },
}

// estado: 'bajo' | 'porVencer' | 'agotado'
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