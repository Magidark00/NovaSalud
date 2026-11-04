import { iniciales } from '../../utils/formato'
import './AvatarCliente.css'

// tamano: 'sm' (tabla) | 'lg' (detalle)
export default function AvatarCliente({ nombre, tamano = 'sm' }) {
  return (
    <span className={`avatar-cliente avatar-cliente--${tamano}`} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  )
}
