import { Pencil, Trash2 } from 'lucide-react'
import Badge from '../common/Badge'
import BotonIcono from '../common/BotonIcono'
import { estadoProducto, formatSoles, formatVence } from '../../utils/formato'
import '../common/Tabla.css'

export default function TablaInventario({ productos, onEditar, onEliminar }) {
  return (
    <div className="tabla-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Proveedor</th>
            <th>Stock</th>
            <th>Stock mín.</th>
            <th>Precio</th>
            <th>Vence</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 && (
            <tr>
              <td colSpan={9} className="data-table__vacio">
                No hay productos que coincidan con los filtros.
              </td>
            </tr>
          )}

          {productos.map((p) => {
            const estado = estadoProducto(p)
            return (
              <tr key={p.id}>
                <td>
                  <span className="data-table__main">{p.nombre}</span>
                  <span className="data-table__sub">{p.presentacion}</span>
                </td>
                <td>{p.categoria}</td>
                <td>{p.proveedor}</td>
                <td className={`data-table__num stock--${estado}`}>{p.stock}</td>
                <td className="data-table__muted">{p.stockMinimo}</td>
                <td className="data-table__num">{formatSoles(p.precio)}</td>
                <td>{formatVence(p.vence)}</td>
                <td>
                  <Badge estado={estado} />
                </td>
                <td>
                  <div className="data-table__actions">
                    <BotonIcono icono={Pencil} etiqueta={`Editar ${p.nombre}`} onClick={() => onEditar(p)} />
                    <BotonIcono icono={Trash2} etiqueta={`Eliminar ${p.nombre}`} tono="danger" onClick={() => onEliminar(p)} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
