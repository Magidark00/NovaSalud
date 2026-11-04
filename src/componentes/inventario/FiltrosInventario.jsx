import CampoBusqueda from '../common/CampoBusqueda'
import Selector from '../common/Selector'
import FiltroCategorias from '../ventas/FiltroCategorias'
import './FiltrosInventario.css'

export default function FiltrosInventario({
  busqueda,
  onBusqueda,
  categoria,
  onCategoria,
  categorias,
  proveedor,
  onProveedor,
  proveedores,
  estados,
  estado,
  onEstado,
}) {
  return (
    <section className="filtros card" aria-label="Filtros">
      <div className="filtros__fila">
        <CampoBusqueda
          valor={busqueda}
          onChange={onBusqueda}
          placeholder="Buscar por nombre o código..."
        />
        <Selector etiqueta="Categoría" valor={categoria} onChange={onCategoria} opciones={categorias} />
        <Selector etiqueta="Proveedor" valor={proveedor} onChange={onProveedor} opciones={proveedores} />
      </div>
      <FiltroCategorias categorias={estados} activa={estado} onChange={onEstado} suave />
    </section>
  )
}
