import { Banknote, CreditCard, Smartphone, Wallet } from 'lucide-react'
import './MetodosPago.css'

const METODOS = [
  { id: 'efectivo', texto: 'Efectivo', Icono: Banknote },
  { id: 'tarjeta', texto: 'Tarjeta', Icono: CreditCard },
  { id: 'yape', texto: 'Yape', Icono: Smartphone },
  { id: 'plin', texto: 'Plin', Icono: Wallet },
]

export default function MetodosPago({ valor, onChange }) {
  return (
    <div className="metodos" role="radiogroup" aria-label="Método de pago">
      {METODOS.map(({ id, texto, Icono }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={valor === id}
          className={`metodos__btn${valor === id ? ' is-active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icono size={18} aria-hidden="true" />
          {texto}
        </button>
      ))}
    </div>
  )
}