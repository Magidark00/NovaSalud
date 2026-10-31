import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatSoles } from '../../utils/formato'
import './TicketItem.css'

export default function TicketItem({ linea, onCambiar, onQuitar }) {
  return (
    <li className="ticket-item">
      <div className="ticket-item__line">
        <span className="ticket-item__name">{linea.nombre}</span>
        <span className="ticket-item__amount">{formatSoles(linea.importe)}</span>
      </div>

      <div className="ticket-item__line">
        <span className="ticket-item__unit">
          {linea.presentacion} · {formatSoles(linea.precio)} c/u
        </span>

        <div className="ticket-item__controls">
          <div className="qty">
            <button
              type="button"
              onClick={() => onCambiar(linea.id, -1)}
              aria-label={`Quitar una unidad de ${linea.nombre}`}
            >
              <Minus size={13} aria-hidden="true" />
            </button>
            <span aria-live="polite">{linea.cantidad}</span>
            <button
              type="button"
              onClick={() => onCambiar(linea.id, 1)}
              disabled={linea.cantidad >= linea.stock}
              aria-label={`Agregar una unidad de ${linea.nombre}`}
            >
              <Plus size={13} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="ticket-item__remove"
            onClick={() => onQuitar(linea.id)}
            aria-label={`Eliminar ${linea.nombre} de la venta`}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}