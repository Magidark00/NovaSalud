import { ChevronDown } from 'lucide-react'
import './Selector.css'

// `etiqueta` es el texto de "todas las opciones" (valor vacío)
export default function Selector({ etiqueta, valor, onChange, opciones }) {
  return (
    <label className="selector">
      <select value={valor} onChange={(e) => onChange(e.target.value)} aria-label={etiqueta}>
        <option value="">{etiqueta}</option>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>{opcion}</option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </label>
  )
}
