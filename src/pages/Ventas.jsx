import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { History } from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import Toast from '../componentes/common/Toast'
import BuscadorProducto from '../componentes/ventas/BuscadorProducto'
import FiltroCategorias from '../componentes/ventas/FiltroCategorias'
import ProductCard from '../componentes/ventas/ProductCard'
import TicketVenta from '../componentes/ventas/TicketVenta'
import { useInventario } from '../context/InventarioContext'
import { useVenta } from '../hooks/useVenta'
import { CATEGORIAS, CLIENTES } from '../data/productos'
import { apiObtenerVentas, apiRegistrarVenta } from '../services/api'
import { formatBoleta, formatSoles, normalizar } from '../utils/formato'
import './Ventas.css'
import Dialogo from '../componentes/common/Dialogo'

export default function Ventas() {
  const { productos, descontarStock, recargarProductos } = useInventario()
  const [parametrosBusqueda] = useSearchParams()
  const clienteQuery = parametrosBusqueda.get('cliente')
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [numeroBoleta, setNumeroBoleta] = useState(461)
  const [listaClientes, setListaClientes] = useState(CLIENTES)
  const [aviso, setAviso] = useState('')
  const [historial, setHistorial] = useState([])
  const [verHistorial, setVerHistorial] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const venta = useVenta(productos)
  const { setCliente } = venta

  useEffect(() => {
    let activo = true
    apiObtenerVentas()
      .then((datos) => {
        if (!activo) return
        if (datos.siguienteBoleta) setNumeroBoleta(datos.siguienteBoleta)
        if (Array.isArray(datos.historial)) setHistorial(datos.historial)
        if (Array.isArray(datos.clientes) && datos.clientes.length > 0) {
          const clientesDisponibles =
            clienteQuery && !datos.clientes.includes(clienteQuery)
              ? [...datos.clientes, clienteQuery]
              : datos.clientes
          setListaClientes(clientesDisponibles)
        }
        if (clienteQuery) {
          setCliente(clienteQuery)
        }
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [clienteQuery, setCliente])

  // El aviso de "boleta emitida" desaparece solo
  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(''), 4000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return productos.filter((p) => {
      const coincideCategoria = categoria === 'Todos' || p.categoria === categoria
      const coincideTexto = !q || normalizar(p.nombre).includes(q) || p.codigo.includes(q)
      return coincideCategoria && coincideTexto
    })
  }, [productos, busqueda, categoria])

  async function cobrar() {
    if (procesando) return
    setProcesando(true)
    try {
      const respuesta = await apiRegistrarVenta({
        items: venta.lineas.map((l) => ({ id: l.id, cantidad: l.cantidad })),
        cliente: venta.cliente,
        metodoPago: venta.metodoPago,
        recibido: venta.recibido,
      })

      descontarStock(venta.lineas)
      await recargarProductos()

      const boletaEmitida = respuesta.venta.boleta
      setAviso(`Boleta ${boletaEmitida} emitida por ${formatSoles(respuesta.venta.total)}`)
      setHistorial((prev) => [respuesta.venta, ...prev])
      setNumeroBoleta(respuesta.siguienteBoleta)
      venta.reiniciar()
    } catch (err) {
      setAviso(err.message || 'Error al registrar la venta.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <>
      <PageHeader titulo="Ventas" estado="Caja abierta">
        <button type="button" className="btn btn--outline" onClick={() => setVerHistorial(true)}>
          <History size={18} aria-hidden="true" />
          Historial de ventas
        </button>
      </PageHeader>

      <div className="ventas">
        <section className="ventas__catalogo" aria-label="Productos">
          <BuscadorProducto valor={busqueda} onChange={setBusqueda} />
          <FiltroCategorias categorias={CATEGORIAS} activa={categoria} onChange={setCategoria} />

          {visibles.length > 0 ? (
            <div className="ventas__grid">
              {visibles.map((p) => (
                <ProductCard key={p.id} producto={p} onAgregar={venta.agregar} />
              ))}
            </div>
          ) : (
            <p className="ventas__vacio">No encontramos productos con esa búsqueda.</p>
          )}

          <div className="ventas__pie">
            <span>
              {visibles.length} {visibles.length === 1 ? 'producto encontrado' : 'productos encontrados'}
            </span>
            <span>Pulsa + para agregar a la venta</span>
          </div>
        </section>

        <TicketVenta
          venta={venta}
          boleta={formatBoleta(numeroBoleta)}
          clientes={listaClientes}
          procesando={procesando}
          onCobrar={cobrar}
        />
      </div>

      <Toast mensaje={aviso} onClose={() => setAviso('')} />
      {verHistorial && (
        <Dialogo
          titulo="Historial de ventas"
          descripcion="Ventas registradas y sincronizadas en la base de datos."
          ancho="ancho"
          onCerrar={() => setVerHistorial(false)}
        >
          {historial.length ? (
            <table className="dialogo__tabla">
              <thead>
                <tr>
                  <th>Boleta</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Unidades</th>
                  <th>Pago</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((v) => (
                  <tr key={v.boleta}>
                    <td>{v.boleta}</td>
                    <td>{v.cliente || 'Cliente general'}</td>
                    <td>{v.fecha}</td>
                    <td>{v.lineas}</td>
                    <td>{v.pago}</td>
                    <td>{formatSoles(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="data-table__vacio">Aún no se han registrado ventas.</p>
          )}
        </Dialogo>
      )}
    </>
  )
}
