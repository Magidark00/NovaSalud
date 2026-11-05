import { CircleCheck, X } from 'lucide-react'
import './Toast.css'

export default function Toast({ mensaje, onClose }) {
  if (!mensaje) return null
  return (
    <div className="toast" role="status">
      <span className="toast__icon"><CircleCheck size={20} aria-hidden="true" /></span>
      <div><strong>{mensaje}</strong><p>La acción se completó correctamente.</p></div>
      {onClose && <button type="button" className="toast__cerrar" aria-label="Cerrar mensaje" onClick={onClose}><X size={18}/></button>}
    </div>
  )
}
