import { Eye, Pencil, Trash2 } from 'lucide-react'
import AvatarCliente from './AvatarCliente'
import BotonIcono from '../common/BotonIcono'
import { formatFecha, formatSoles } from '../../utils/formato'
import '../common/Tabla.css'

export default function TablaClientes({ clientes, seleccionadoId, onSeleccionar, onEditar, onEliminar }) {
  return (
    <div className="tabla-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>DNI</th>
            <th>Teléfono</th>
            <th>Compras</th>
            <th>Última compra</th>
            <th>Total gastado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 && (
            <tr>
              <td colSpan={7} className="data-table__vacio">
                No encontramos clientes con ese nombre o DNI.
              </td>
            </tr>
          )}

          {clientes.map((c) => (
            <tr
              key={c.id}
              className={`is-clickable${c.id === seleccionadoId ? ' is-selected' : ''}`}
              onClick={() => onSeleccionar(c.id)}
            >
              <td>
                <div className="data-table__persona">
                  <AvatarCliente nombre={c.nombre} />
                  <span className="data-table__main">{c.nombre}</span>
                </div>
              </td>
              <td>{c.dni}</td>
              <td>{c.telefono}</td>
              <td className="data-table__num">{c.compras}</td>
              <td>{formatFecha(c.ultimaCompra)}</td>
              <td className="data-table__num">{formatSoles(c.totalGastado)}</td>
              <td>
                {/* stopPropagation: editar/eliminar no deben cambiar el cliente seleccionado */}
                <div className="data-table__actions" onClick={(e) => e.stopPropagation()}>
                  <BotonIcono icono={Eye} etiqueta={`Ver detalle de ${c.nombre}`} onClick={() => onSeleccionar(c.id)} />
                  <BotonIcono icono={Pencil} etiqueta={`Editar ${c.nombre}`} onClick={() => onEditar(c)} />
                  <BotonIcono icono={Trash2} etiqueta={`Eliminar ${c.nombre}`} tono="danger" onClick={() => onEliminar(c)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
