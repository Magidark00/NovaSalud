import { Pill, Plus } from 'lucide-react'
import Badge from '../common/Badge'
import { estadoStock, formatSoles } from '../../utils/formato'
import './ProductCard.css'

export default function ProductCard({ producto, onAgregar }) {
  const estado = estadoStock(producto)
  const agotado = estado === 'agotado'
  const textoStock = agotado ? 'Agotado' : `Stock: ${producto.stock}`

  return (
    <article className="product card">
      <div className="product__top">
        <span className={`product__icon${agotado ? ' is-agotado' : ''}`}>
          <Pill size={20} aria-hidden="true" />
        </span>
        {estado === 'bajo' && <Badge estado="bajo" />}
      </div>

      <h3 className="product__name">{producto.nombre}</h3>
      <p className="product__pres">{producto.presentacion}</p>
      <p className={`product__stock product__stock--${estado}`}>{textoStock}</p>

      <div className="product__bottom">
        <span className="product__price">{formatSoles(producto.precio)}</span>
        <button
          type="button"
          className="product__add"
          disabled={agotado}
          onClick={() => onAgregar(producto.id)}
          aria-label={`Agregar ${producto.nombre} a la venta`}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}