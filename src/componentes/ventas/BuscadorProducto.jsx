import { Search } from 'lucide-react'
import './BuscadorProducto.css'

export default function BuscadorProducto({ valor, onChange }) {
  return (
    <label className="buscador card">
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Busca producto..."
        aria-label="Busca producto"
        autoFocus
      />
      <Search size={18} aria-hidden="true" />
    </label>
  )
}
