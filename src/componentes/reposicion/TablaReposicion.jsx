import Badge from '../common/Badge'

export default function TablaReposicion({ productos, seleccion, todosMarcados, onAlternar, onAlternarTodos }) {
  return (
    <div className="repo-tabla__scroll">
      <table className="repo-tabla">
        <thead>
          <tr>
            <th className="repo-tabla__check">
              <input
                type="checkbox"
                checked={todosMarcados}
                onChange={onAlternarTodos}
                disabled={productos.length === 0}
                aria-label="Seleccionar todos los productos de la página"
              />
            </th>
            <th>Producto</th>
            <th>Proveedor</th>
            <th>Stock</th>
            <th>Stock mín.</th>
            <th>Sugerido</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 && (
            <tr>
              <td colSpan={7} className="repo-tabla__vacio">
                No hay productos con este filtro.
              </td>
            </tr>
          )}
          {productos.map((p) => (
            <tr key={p.id} className={p.id in seleccion ? 'is-selected' : ''}>
              <td className="repo-tabla__check">
                <input
                  type="checkbox"
                  checked={p.id in seleccion}
                  onChange={() => onAlternar(p)}
                  aria-label={`Seleccionar ${p.nombre}`}
                />
              </td>
              <td className="repo-tabla__nombre">{p.nombre}</td>
              <td>{p.proveedor}</td>
              <td>
                <span className={`repo-stock repo-stock--${p.estado}`}>{p.stock}</span>
              </td>
              <td className="repo-tabla__muted">{p.stockMin}</td>
              <td className="repo-tabla__nombre">{p.sugerido}</td>
              <td>
                <Badge estado={p.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
