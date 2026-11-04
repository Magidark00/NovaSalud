import { Minus, Plus } from 'lucide-react'

export default function OrdenReposicion({ grupos, totalProductos, aviso, onCambiar, onGenerar, onLimpiar }) {
  const vacia = totalProductos === 0

  return (
    <section className="card repo-orden" aria-label="Orden de reposición">
      <h2 className="repo-titulo">Orden de reposición</h2>

      {vacia && <p className="repo-orden__vacio">Marca productos en la lista para armar la orden.</p>}

      {grupos.map((g) => (
        <div key={g.proveedor} className="repo-orden__grupo">
          <span className="repo-orden__proveedor">{g.proveedor}</span>
          {g.items.map((item) => (
            <div key={item.id} className="repo-orden__item">
              <span>{item.nombre}</span>
              <div className="repo-cantidad">
                <button type="button" onClick={() => onCambiar(item.id, -1)} aria-label={`Restar ${item.nombre}`}>
                  <Minus size={14} aria-hidden="true" />
                </button>
                <span>{item.cantidad}</span>
                <button type="button" onClick={() => onCambiar(item.id, 1)} aria-label={`Sumar ${item.nombre}`}>
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {!vacia && (
        <p className="repo-orden__resumen">
          {totalProductos} producto{totalProductos !== 1 ? 's' : ''} · {grupos.length} proveedor
          {grupos.length !== 1 ? 'es' : ''}
        </p>
      )}

      <button type="button" className="btn btn--primary repo-orden__generar" onClick={onGenerar} disabled={vacia}>
        Generar orden
      </button>
      <button type="button" className="repo-orden__limpiar" onClick={onLimpiar} disabled={vacia}>
        Limpiar selección
      </button>

      {aviso && (
        <p className="repo-orden__aviso" role="status">
          {aviso}
        </p>
      )}
    </section>
  )
}
