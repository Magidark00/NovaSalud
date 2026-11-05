import { useEffect, useMemo, useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import BuscadorProducto from './BuscadorProducto'
import FiltroCategorias from './FiltroCategorias'
import ProductCard from './ProductCard'
import TicketVenta from './TicketVenta'
import Toast from '../common/Toast'
import { useInventario } from '../../context/InventarioContext'
import { useVenta } from '../../hooks/useVenta'
import { CATEGORIAS, CLIENTES } from '../../data/productos'
import { apiObtenerVentas, apiRegistrarVenta } from '../../services/api'
import { formatSoles, normalizar } from '../../utils/formato'
import './ModalPos.css'

export default function ModalPos({ clienteInicial = null, onCerrar }) {
  const { productos, descontarStock, recargarProductos } = useInventario()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [correlativos, setCorrelativos] = useState({
    Boleta: 'B001-000461',
    Factura: 'F001-000102',
    'Nota de venta': 'NV01-000202',
  })
  const [listaClientes, setListaClientes] = useState(CLIENTES)
  const [procesando, setProcesando] = useState(false)
  const [aviso, setAviso] = useState('')
  const venta = useVenta(productos)
  const { setCliente } = venta

  useEffect(() => {
    let activo = true
    apiObtenerVentas()
      .then((datos) => {
        if (!activo) return
        if (datos.correlativos) setCorrelativos(datos.correlativos)
        if (Array.isArray(datos.clientes) && datos.clientes.length > 0) {
          const clientesDisponibles =
            clienteInicial && !datos.clientes.includes(clienteInicial)
              ? [...datos.clientes, clienteInicial]
              : datos.clientes
          setListaClientes(clientesDisponibles)
        }
        if (clienteInicial) {
          setCliente(clienteInicial)
        }
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [clienteInicial, setCliente])

  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [onCerrar])

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return productos.filter((p) => {
      const coincideCategoria = categoria === 'Todos' || p.categoria === categoria
      const coincideTexto = !q || normalizar(p.nombre).includes(q) || p.codigo.includes(q)
      return coincideCategoria && coincideTexto
    })
  }, [productos, busqueda, categoria])

  const codigoActual = correlativos[venta.tipoComprobante] || correlativos.Boleta

  async function cobrar() {
    if (procesando) return
    setProcesando(true)
    try {
      const respuesta = await apiRegistrarVenta({
        items: venta.lineas.map((l) => ({ id: l.id, cantidad: l.cantidad })),
        tipoComprobante: venta.tipoComprobante,
        documentoCliente: venta.documentoCliente,
        cliente: venta.cliente,
        metodoPago: venta.metodoPago,
        recibido: venta.recibido,
      })

      descontarStock(venta.lineas)
      await recargarProductos()

      if (respuesta.correlativos) {
        setCorrelativos(respuesta.correlativos)
      }

      window.dispatchEvent(
        new CustomEvent('novasalud:venta-registrada', { detail: respuesta })
      )

      setAviso(
        `${respuesta.venta.tipoComprobante} ${respuesta.venta.boleta} emitida por ${formatSoles(respuesta.venta.total)}`
      )
      venta.reiniciar()
    } catch (err) {
      setAviso(err.message || 'No se pudo emitir el comprobante.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="pos-modal__backdrop" onClick={onCerrar}>
      <div
        className="pos-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-modal-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="pos-modal__header">
          <div className="pos-modal__title-wrap">
            <span className="pos-modal__icon">
              <ShoppingCart size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 id="pos-modal-titulo">Punto de Venta (POS)</h2>
              <p>Emisión rápida de Boleta, Factura o Nota de Venta con descuento automático de stock.</p>
            </div>
          </div>
          <button
            type="button"
            className="pos-modal__close"
            onClick={onCerrar}
            aria-label="Cerrar Punto de Venta"
          >
            <X size={20} />
          </button>
        </header>

        <div className="pos-modal__body">
          <section className="pos-modal__catalogo card" aria-label="Catálogo de productos">
            <BuscadorProducto valor={busqueda} onChange={setBusqueda} />
            <FiltroCategorias categorias={CATEGORIAS} activa={categoria} onChange={setCategoria} />

            {visibles.length > 0 ? (
              <div className="pos-modal__grid">
                {visibles.map((p) => (
                  <ProductCard key={p.id} producto={p} onAgregar={venta.agregar} />
                ))}
              </div>
            ) : (
              <p className="pos-modal__empty">No se encontraron productos con esa búsqueda.</p>
            )}
          </section>

          <TicketVenta
            venta={venta}
            boleta={codigoActual}
            clientes={listaClientes}
            procesando={procesando}
            onCobrar={cobrar}
          />
        </div>

        <Toast mensaje={aviso} onClose={() => setAviso('')} />
      </div>
    </div>
  )
}
