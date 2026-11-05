import { useEffect, useMemo, useState } from 'react'
import { History } from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import Toast from '../componentes/common/Toast'
import BuscadorProducto from '../componentes/ventas/BuscadorProducto'
import FiltroCategorias from '../componentes/ventas/FiltroCategorias'
import ProductCard from '../componentes/ventas/ProductCard'
import TicketVenta from '../componentes/ventas/TicketVenta'
import { useInventario } from '../context/InventarioContext'
import { useVenta } from '../hooks/useVenta'
import { CATEGORIAS } from '../data/productos'
import { formatBoleta, formatSoles, normalizar } from '../utils/formato'
import './Ventas.css'
import Dialogo from '../componentes/common/Dialogo'

export default function Ventas() {
  const { productos, descontarStock } = useInventario()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [numeroBoleta, setNumeroBoleta] = useState(461)
  const [aviso, setAviso] = useState('')
  const [historial, setHistorial] = useState([])
  const [verHistorial, setVerHistorial] = useState(false)
  const venta = useVenta(productos)

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

  function cobrar() {
    const boleta = formatBoleta(numeroBoleta)
    descontarStock(venta.lineas) // baja el stock en todo el sistema
    setAviso(`Boleta ${boleta} emitida por ${formatSoles(venta.totales.total)}`)
    setHistorial(prev => [{ boleta, fecha: new Date().toLocaleString('es-PE'), lineas: venta.lineas.length, total: venta.totales.total }, ...prev])
    setNumeroBoleta((n) => n + 1)
    venta.reiniciar()
  }

  return (
    <>
      <PageHeader titulo="Ventas" estado="Caja abierta">
        <button type="button" className="btn btn--outline" onClick={()=>setVerHistorial(true)}>
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

        <TicketVenta venta={venta} boleta={formatBoleta(numeroBoleta)} onCobrar={cobrar} />
      </div>

      <Toast mensaje={aviso} onClose={() => setAviso('')} />
      {verHistorial && <Dialogo titulo="Historial de ventas" descripcion="Ventas registradas durante esta sesión." ancho="ancho" onCerrar={()=>setVerHistorial(false)}>{historial.length ? <table className="dialogo__tabla"><thead><tr><th>Boleta</th><th>Fecha</th><th>Productos</th><th>Total</th></tr></thead><tbody>{historial.map(v=><tr key={v.boleta}><td>{v.boleta}</td><td>{v.fecha}</td><td>{v.lineas}</td><td>{formatSoles(v.total)}</td></tr>)}</tbody></table> : <p className="data-table__vacio">Aún no se han registrado ventas en esta sesión.</p>}</Dialogo>}
    </>
  )
}
