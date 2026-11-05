import { Plus } from 'lucide-react'
import AvatarCliente from './AvatarCliente'
import { usePos } from '../../context/PosContext'
import { formatFechaCorta, formatSoles } from '../../utils/formato'
import './DetalleCliente.css'

export default function DetalleCliente({ cliente }) {
  const { abrirPos } = usePos()

  if (!cliente) {
    return (
      <aside className="detalle card" aria-label="Detalle del cliente">
        <h2>Detalle del cliente</h2>
        <p className="detalle__vacio">Selecciona un cliente de la lista para ver su detalle.</p>
      </aside>
    )
  }

  return (
    <aside className="detalle card" aria-label="Detalle del cliente">
      <h2>Detalle del cliente</h2>

      <div className="detalle__perfil">
        <AvatarCliente nombre={cliente.nombre} tamano="lg" />
        <p className="detalle__nombre">{cliente.nombre}</p>
        <p className="detalle__contacto">DNI {cliente.dni} · {cliente.telefono}</p>
      </div>

      <dl className="detalle__resumen">
        <div>
          <dt>Compras</dt>
          <dd>{cliente.compras}</dd>
        </div>
        <div>
          <dt>Total gastado</dt>
          <dd className="detalle__gastado">{formatSoles(cliente.totalGastado)}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => abrirPos({ cliente: cliente.nombre })}
      >
        <Plus size={18} aria-hidden="true" />
        Nueva venta
      </button>

      <section className="detalle__compras" aria-label="Últimas compras">
        <h3>Últimas compras</h3>
        {cliente.ultimasCompras.length > 0 ? (
          <ul className="detalle__lista">
            {cliente.ultimasCompras.map((compra) => (
              <li key={compra.codigo} className="detalle__compra">
                <div>
                  <span>{compra.codigo} · {formatFechaCorta(compra.fecha)}</span>
                  <strong>{formatSoles(compra.total)}</strong>
                </div>
                <span className="detalle__pago">{compra.pago}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detalle__vacio">Este cliente aún no tiene compras.</p>
        )}
      </section>
    </aside>
  )
}
