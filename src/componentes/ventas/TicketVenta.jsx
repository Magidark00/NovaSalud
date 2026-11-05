import { Link } from 'react-router-dom'
import { Check, ChevronDown, User } from 'lucide-react'
import TicketItem from './TicketItem'
import MetodosPago from './MetodosPago'
import { CLIENTES } from '../../data/productos'
import { formatSoles } from '../../utils/formato'
import './TicketVenta.css'

// `venta` es lo que devuelve el hook useVenta()
export default function TicketVenta({
  venta,
  boleta,
  clientes = CLIENTES,
  procesando = false,
  onCobrar,
}) {
  const {
    lineas,
    unidades,
    totales,
    cliente,
    setCliente,
    metodoPago,
    setMetodoPago,
    recibido,
    setRecibido,
    vuelto,
    puedeCobrar,
    cambiarCantidad,
    quitar,
    vaciar,
    reiniciar,
  } = venta

  const esEfectivo = metodoPago === 'efectivo'
  const hayProductos = lineas.length > 0

  return (
    <aside className="ticket card" aria-label="Resumen de venta">
      <div className="ticket__head">
        <h2>Resumen de venta</h2>
        <span className="ticket__code">{boleta}</span>
      </div>

      <div className="ticket__row">
        <label htmlFor="cliente" className="ticket__label">Cliente</label>
        <Link to="/clientes" className="link-small">+ Nuevo cliente</Link>
      </div>
      <div className="select">
        <User size={16} aria-hidden="true" />
        <select id="cliente" value={cliente} onChange={(e) => setCliente(e.target.value)}>
          {clientes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </div>

      <div className="ticket__row ticket__row--productos">
        <span className="ticket__label">
          Productos · {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
        </span>
        {hayProductos && (
          <button type="button" className="link-small" onClick={vaciar}>
            Vaciar carrito
          </button>
        )}
      </div>

      {hayProductos ? (
        <ul className="ticket__items">
          {lineas.map((linea) => (
            <TicketItem key={linea.id} linea={linea} onCambiar={cambiarCantidad} onQuitar={quitar} />
          ))}
        </ul>
      ) : (
        <p className="ticket__empty">
          Aún no hay productos. Escanea un código o pulsa + en un producto.
        </p>
      )}

      <dl className="ticket__totales">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatSoles(totales.subtotal)}</dd>
        </div>
        <div>
          <dt>IGV (18%)</dt>
          <dd>{formatSoles(totales.igv)}</dd>
        </div>
        <div>
          <dt>Descuento</dt>
          <dd>{formatSoles(totales.descuento)}</dd>
        </div>
      </dl>

      <div className="ticket__total">
        <span>Total a pagar</span>
        <strong>{formatSoles(totales.total)}</strong>
      </div>

      <p className="ticket__label ticket__label--pago">Método de pago</p>
      <MetodosPago valor={metodoPago} onChange={setMetodoPago} />

      {esEfectivo && (
        <div className="ticket__efectivo">
          <div>
            <label htmlFor="recibido" className="ticket__label">Efectivo recibido</label>
            <input
              id="recibido"
              type="number"
              min="0"
              step="0.10"
              inputMode="decimal"
              placeholder="0.00"
              value={recibido}
              onChange={(e) => setRecibido(e.target.value)}
            />
          </div>
          <div>
            <span className="ticket__label">Vuelto</span>
            <output className="ticket__vuelto">{formatSoles(vuelto)}</output>
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary btn--block"
        disabled={!puedeCobrar || procesando}
        onClick={onCobrar}
      >
        <Check size={18} aria-hidden="true" />
        {procesando ? 'Procesando...' : `Cobrar ${formatSoles(totales.total)}`}
      </button>

      {hayProductos && esEfectivo && !puedeCobrar && (
        <p className="ticket__hint">El efectivo recibido debe cubrir el total.</p>
      )}

      <button type="button" className="btn btn--outline btn--block" disabled={!hayProductos || procesando} onClick={reiniciar}>
        Cancelar venta
      </button>

      <p className="ticket__note">Se emitirá una boleta al confirmar el pago</p>
    </aside>
  )
}
