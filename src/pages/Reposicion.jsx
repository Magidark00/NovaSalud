import { useMemo, useState } from 'react'
import { CircleX, ClipboardList, Plus, TriangleAlert } from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import StatCard from '../componentes/common/StatCard'
import StatsGrid from '../componentes/common/StatsGrid'
import Paginacion from '../componentes/common/Paginacion'
import TablaReposicion from '../componentes/reposicion/TablaReposicion'
import OrdenReposicion from '../componentes/reposicion/OrdenReposicion'
import RecientesReposicion from '../componentes/reposicion/RecientesReposicion'
import {
  FILTROS_REPOSICION,
  PRODUCTOS_REPONER,
  REPOSICIONES_RECIENTES,
  RESUMEN_REPOSICION,
} from '../data/reposicion'
import '../componentes/reposicion/Reposicion.css'
import './Reposicion.css'

const POR_PAGINA = 4

function fechaCorta() {
  const hoy = new Date()
  return `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

export default function Reposicion() {
  const [filtro, setFiltro] = useState('todos')
  const [pagina, setPagina] = useState(1)
  // seleccion: { [idProducto]: cantidadAPedir }
  const [seleccion, setSeleccion] = useState(() => ({ 1: 30, 2: 30, 3: 20 }))
  const [recientes, setRecientes] = useState(REPOSICIONES_RECIENTES)
  const [pendientes, setPendientes] = useState(RESUMEN_REPOSICION.pedidosPendientes)
  const [aviso, setAviso] = useState('')

  const filtrados = useMemo(
    () => (filtro === 'todos' ? PRODUCTOS_REPONER : PRODUCTOS_REPONER.filter((p) => p.estado === filtro)),
    [filtro],
  )

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)
  const todosMarcados = visibles.length > 0 && visibles.every((p) => p.id in seleccion)

  // Productos elegidos, agrupados por proveedor (orden alfabético)
  const grupos = useMemo(() => {
    const porProveedor = {}
    PRODUCTOS_REPONER.filter((p) => p.id in seleccion).forEach((p) => {
      ;(porProveedor[p.proveedor] ??= []).push({ id: p.id, nombre: p.nombre, cantidad: seleccion[p.id] })
    })
    return Object.keys(porProveedor)
      .sort((a, b) => a.localeCompare(b))
      .map((proveedor) => ({ proveedor, items: porProveedor[proveedor] }))
  }, [seleccion])

  const totalSeleccionados = Object.keys(seleccion).length
  const porReponer = RESUMEN_REPOSICION.stockBajo + RESUMEN_REPOSICION.agotados

  function cambiarFiltro(id) {
    setFiltro(id)
    setPagina(1)
  }

  function alternar(producto) {
    setAviso('')
    setSeleccion((prev) => {
      const copia = { ...prev }
      if (producto.id in copia) delete copia[producto.id]
      else copia[producto.id] = producto.sugerido
      return copia
    })
  }

  function alternarTodos() {
    setAviso('')
    setSeleccion((prev) => {
      const copia = { ...prev }
      visibles.forEach((p) => {
        if (todosMarcados) delete copia[p.id]
        else if (!(p.id in copia)) copia[p.id] = p.sugerido
      })
      return copia
    })
  }

  function cambiarCantidad(id, delta) {
    setSeleccion((prev) => ({ ...prev, [id]: Math.min(999, Math.max(1, prev[id] + delta)) }))
  }

  function generarOrden() {
    if (totalSeleccionados === 0) return
    const fecha = fechaCorta()
    const nuevas = grupos.flatMap((g) =>
      g.items.map((i) => ({
        id: `${Date.now()}-${i.id}`,
        fecha,
        producto: i.nombre,
        cantidad: i.cantidad,
        estado: 'pendiente',
      })),
    )
    // TODO: enviar la orden al backend / actualizar el contexto de inventario
    setRecientes((prev) => [...nuevas, ...prev].slice(0, 5))
    setPendientes((n) => n + grupos.length)
    setAviso(`Se generaron ${grupos.length} orden${grupos.length !== 1 ? 'es' : ''} de reposición.`)
    setSeleccion({})
  }

  function limpiar() {
    setSeleccion({})
    setAviso('')
  }

  return (
    <>
      <PageHeader titulo="Reposición" estado={`${porReponer} por reponer`}>
        {/* TODO: abrir historial de reposiciones */}
        <button type="button" className="btn btn--outline">
          Historial
        </button>
        {/* TODO: formulario de nueva reposición manual */}
        <button type="button" className="btn btn--primary">
          <Plus size={18} aria-hidden="true" />
          Nueva reposición
        </button>
      </PageHeader>

      <StatsGrid columnas={4}>
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Stock bajo" valor={RESUMEN_REPOSICION.stockBajo} valorColoreado />
        <StatCard icono={CircleX} tono="danger" etiqueta="Agotados" valor={RESUMEN_REPOSICION.agotados} valorColoreado />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Por vencer" valor={RESUMEN_REPOSICION.porVencer} valorColoreado />
        <StatCard icono={ClipboardList} tono="teal" etiqueta="Pedidos pendientes" valor={pendientes} valorColoreado />
      </StatsGrid>

      <div className="reposicion">
        <section className="card tabla-card reposicion__lista" aria-label="Productos por reponer">
          <h2 className="repo-titulo">Productos por reponer</h2>
          <div className="repo-filtros" role="group" aria-label="Filtrar por estado">
            {FILTROS_REPOSICION.map((f) => (
              <button
                key={f.id}
                type="button"
                className={filtro === f.id ? 'is-active' : ''}
                aria-pressed={filtro === f.id}
                onClick={() => cambiarFiltro(f.id)}
              >
                {f.texto}
              </button>
            ))}
          </div>

          <TablaReposicion
            productos={visibles}
            seleccion={seleccion}
            todosMarcados={todosMarcados}
            onAlternar={alternar}
            onAlternarTodos={alternarTodos}
          />

          <Paginacion
            texto={`${totalSeleccionados} seleccionado${totalSeleccionados !== 1 ? 's' : ''}`}
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            onChange={setPagina}
          />
        </section>

        <div className="reposicion__lateral">
          <OrdenReposicion
            grupos={grupos}
            totalProductos={totalSeleccionados}
            aviso={aviso}
            onCambiar={cambiarCantidad}
            onGenerar={generarOrden}
            onLimpiar={limpiar}
          />
          <RecientesReposicion reposiciones={recientes} />
        </div>
      </div>
    </>
  )
}
