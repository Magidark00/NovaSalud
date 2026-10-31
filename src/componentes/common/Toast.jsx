import { Check } from 'lucide-react'
import './Toast.css'

export default function Toast({ mensaje }) {
  if (!mensaje) return null
  return (
    <div className="toast" role="status">
      <Check size={18} aria-hidden="true" />
      {mensaje}
    </div>
  )
}