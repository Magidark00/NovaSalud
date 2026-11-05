import { useEffect, useMemo, useState } from 'react'
import { Check, CircleX, ClipboardList, TriangleAlert } from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import StatCard from '../componentes/common/StatCard'
import StatsGrid from '../componentes/common/StatsGrid'
import Paginacion from '../componentes/common/Paginacion'
import TablaReposicion from '../componentes/reposicion/TablaReposicion'
import OrdenReposicion from '../componentes/reposicion/OrdenReposicion'
import RecientesReposicion from '../componentes/reposicion/RecientesReposicion'
import { useInventario } from '../context/InventarioContext'
import {
  FILTROS_REPOSICION,
  PRODUCTOS_REPONER,
  REPOSICIONES_RECIENTES,
  RESUMEN_REPOSICION,
} from '../data/reposicion'
import {
  apiCrearOrdenReposicion,
  apiObtenerReposicion,
  apiRecibirOrdenReposicion,
} from '../services/api'
import '../componentes/reposicion/Reposicion.css'
import './Reposicion.css'
import Dialogo from '../componentes/common/Dialogo'

const POR_PAGINA = 4

export default function Reposicion() {
  const { recargarProductos } = useInventario()
  const [filtro, setFiltro] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [productosReponer, setProductosReponer] = useState(PRODUCTOS_REPONER)
  const [resumen, setResumen] = useState(RESUMEN_REPOSICION)
  // seleccion: { [idProducto]: cantidadAPedir }
  const [seleccion, setSeleccion] = useState({})
  const [recientes, setRecientes] = useState(REPOSICIONES_RECIENTES)
  const [aviso, setAviso] = useState('')
  const [verHistorial, setVerHistorial] = useState(false)

  useEffect(() => {
    let activo = true
    apiObtenerReposicion()
      .then((datos) => {
        if (!activo) return
        if (Array.isArray(datos.productosReponer)) {
          setProductosReponer(datos.productosReponer)
          const seleccionInicial = {}
          datos.productosReponer.slice(0, 3).forEach((p) => {
            seleccionInicial[p.id] = p.sugerido
          })
          setSeleccion(seleccionInicial)
        }
        if (Array.isArray(datos.recientes)) setRecientes(datos.recientes)
        if (datos.resumen) setResumen(datos.resumen)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  const filtrados = useMemo(
    () => (filtro === 'todos' ? productosReponer : productosReponer.filter((p) => p.estado === filtro)),
    [filtro, productosReponer]
  )

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)
  const todosMarcados = visibles.length > 0 && visibles.every((p) => p.id in seleccion)

  // Productos elegidos, agrupados por proveedor (orden alfabético)
  const grupos = useMemo(() => {
    const porProveedor = {}
    productosReponer
      .filter((p) => p.id in seleccion)
      .forEach((p) => {
        ;(porProveedor[p.proveedor] ??= []).push({ id: p.id, nombre: p.nombre, cantidad: seleccion[p.id] })
      })
    return Object.keys(porProveedor)
      .sort((a, b) => a.localeCompare(b))
      .map((proveedor) => ({ proveedor, items: porProveedor[proveedor] }))
  }, [seleccion, productosReponer])

  const totalSeleccionados = Object.keys(seleccion).length
  const porReponer = resumen.stockBajo + resumen.agotados

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

  async function generarOrden() {
    if (totalSeleccionados === 0) return
    try {
      const respuesta = await apiCrearOrdenReposicion(grupos)
      if (Array.isArray(respuesta.recientes)) setRecientes(respuesta.recientes)
      if (respuesta.resumen) setResumen(respuesta.resumen)
      if (Array.isArray(respuesta.productosReponer)) setProductosReponer(respuesta.productosReponer)
      setAviso(`Se generaron ${grupos.length} orden${grupos.length !== 1 ? 'es' : ''} de reposición en la base de datos.`)
      setSeleccion({})
    } catch (err) {
      setAviso(err.message || 'No se pudo generar la orden.')
    }
  }

  async function recibirOrden(ordenId) {
    if (!ordenId) return
    try {
      const respuesta = await apiRecibirOrdenReposicion(ordenId)
      if (Array.isArray(respuesta.recientes)) setRecientes(respuesta.recientes)
      if (respuesta.resumen) setResumen(respuesta.resumen)
      if (Array.isArray(respuesta.productosReponer)) setProductosReponer(respuesta.productosReponer)
      await recargarProductos()
      setAviso('Orden recibida: el stock fue actualizado automáticamente en el inventario.')
    } catch (err) {
      setAviso(err.message || 'No se pudo recibir la orden.')
    }
  }

  function limpiar() {
    setSeleccion({})
    setAviso('')
  }

  return (
    <>
      <PageHeader titulo="Reposición" estado={`${porReponer} por reponer`}>
        <button type="button" className="btn btn--outline" onClick={() => setVerHistorial(true)}>
          Historial
        </button>
      </PageHeader>

      <StatsGrid columnas={4}>
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Stock bajo" valor={resumen.stockBajo} valorColoreado />
        <StatCard icono={CircleX} tono="danger" etiqueta="Agotados" valor={resumen.agotados} valorColoreado />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Por vencer" valor={resumen.porVencer} valorColoreado />
        <StatCard icono={ClipboardList} tono="teal" etiqueta="Pedidos pendientes" valor={resumen.pedidosPendientes} valorColoreado />
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
          <RecientesReposicion reposiciones={recientes.slice(0, 5)} />
        </div>
      </div>
      {verHistorial && (
        <Dialogo
          titulo="Historial de reposiciones"
          descripcion="Órdenes recientes registradas en la base de datos. Al marcar una orden como recibida se suma automáticamente el stock al inventario."
          ancho="ancho"
          onCerrar={() => setVerHistorial(false)}
        >
          <table className="dialogo__tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((r) => (
                <tr key={r.id}>
                  <td>{r.fecha}</td>
                  <td>{r.producto}</td>
                  <td>{r.proveedor || '—'}</td>
                  <td>{r.cantidad}</td>
                  <td>{r.estado === 'recibida' ? 'Recibida' : 'Pendiente'}</td>
                  <td>
                    {r.estado === 'pendiente' && r.ordenId ? (
                      <button
                        type="button"
                        className="link-small"
                        onClick={() => recibirOrden(r.ordenId)}
                      >
                        <Check size={13} style={{ verticalAlign: 'middle' }} /> Recibir stock
                      </button>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>Completado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Dialogo>
      )}
    </>
  )
}
