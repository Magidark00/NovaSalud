import { Search } from 'lucide-react'
import './CampoBusqueda.css'

export default function CampoBusqueda({ valor, onChange, placeholder }) {
  return (
    <label className="campo-busqueda">
      <Search size={18} aria-hidden="true" />
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  )
}
