import { ScanBarcode, Search } from 'lucide-react'
import './BuscadorProducto.css'

// Con una pistola lectora, el código se escribe solo y termina con Enter.
export default function BuscadorProducto({ valor, onChange, onEnter }) {
  return (
    <label className="buscador card">
      <ScanBarcode size={22} aria-hidden="true" />
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        placeholder="Escanear código o buscar producto..."
        aria-label="Escanear código o buscar producto"
        autoFocus
      />
      <Search size={18} aria-hidden="true" />
    </label>
  )
}