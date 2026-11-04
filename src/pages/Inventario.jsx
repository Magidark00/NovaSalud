import { useMemo, useState } from 'react'
import { CircleX, Download, Package, Plus, TriangleAlert } from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import StatCard from '../componentes/common/StatCard'
import StatsGrid from '../componentes/common/StatsGrid'
import Paginacion from '../componentes/common/Paginacion'
import FiltrosInventario from '../componentes/inventario/FiltrosInventario'
import TablaInventario from '../componentes/inventario/TablaInventario'
import { useInventario } from '../context/InventarioContext'
import { estadoProducto, normalizar } from '../utils/formato'

const POR_PAGINA = 5
const ESTADOS = {
  Normal: 'normal',
  'Stock bajo': 'bajo',
  'Por vencer': 'porVencer',
  Agotado: 'agotado',
}
const FILTROS_ESTADO = ['Todos', ...Object.keys(ESTADOS)]

export default function Inventario() {
  const { productos, eliminarProducto } = useInventario()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [estado, setEstado] = useState('Todos')
  const [pagina, setPagina] = useState(1)

  // Cada vez que cambia un filtro se vuelve a la página 1
  const cambiar = (setter) => (valor) => {
    setter(valor)
    setPagina(1)
  }

  const categorias = useMemo(() => [...new Set(productos.map((p) => p.categoria))], [productos])
  const proveedores = useMemo(() => [...new Set(productos.map((p) => p.proveedor))], [productos])

  const conteo = useMemo(() => {
    const total = { bajo: 0, porVencer: 0, agotado: 0 }
    productos.forEach((p) => {
      const e = estadoProducto(p)
      if (e in total) total[e] += 1
    })
    return total
  }, [productos])

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return productos.filter((p) => {
      const coincideTexto = !q || normalizar(p.nombre).includes(q) || p.codigo.includes(q)
      return (
        coincideTexto &&
        (!categoria || p.categoria === categoria) &&
        (!proveedor || p.proveedor === proveedor) &&
        (estado === 'Todos' || estadoProducto(p) === ESTADOS[estado])
      )
    })
  }, [productos, busqueda, categoria, proveedor, estado])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const visibles = filtrados.slice(inicio, inicio + POR_PAGINA)
  const desde = filtrados.length ? inicio + 1 : 0

  function eliminar(producto) {
    if (window.confirm(`¿Eliminar "${producto.nombre}" del inventario?`)) {
      eliminarProducto(producto.id)
    }
  }

  // TODO: abrir el formulario de edición
  function editar() {}

  return (
    <>
      <PageHeader titulo="Inventario" estado={`${productos.length} productos`}>
        {/* TODO: exportar la lista a CSV / Excel */}
        <button type="button" className="btn btn--outline">
          <Download size={18} aria-hidden="true" />
          Exportar
        </button>
        {/* TODO: abrir el formulario de nuevo producto */}
        <button type="button" className="btn btn--primary">
          <Plus size={18} aria-hidden="true" />
          Nuevo producto
        </button>
      </PageHeader>

      <StatsGrid>
        <StatCard icono={Package} tono="teal" etiqueta="Total productos" valor={productos.length} valorColoreado />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Stock bajo" valor={conteo.bajo} valorColoreado />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Por vencer" valor={conteo.porVencer} valorColoreado />
        <StatCard icono={CircleX} tono="danger" etiqueta="Agotados" valor={conteo.agotado} valorColoreado />
      </StatsGrid>

      <FiltrosInventario
        busqueda={busqueda}
        onBusqueda={cambiar(setBusqueda)}
        categoria={categoria}
        onCategoria={cambiar(setCategoria)}
        categorias={categorias}
        proveedor={proveedor}
        onProveedor={cambiar(setProveedor)}
        proveedores={proveedores}
        estados={FILTROS_ESTADO}
        estado={estado}
        onEstado={cambiar(setEstado)}
      />

      <section className="card tabla-card" aria-label="Lista de productos">
        <TablaInventario productos={visibles} onEditar={editar} onEliminar={eliminar} />
        <Paginacion
          texto={`Mostrando ${desde}-${inicio + visibles.length} de ${filtrados.length}`}
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          onChange={setPagina}
        />
      </section>
    </>
  )
}
