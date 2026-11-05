import { useMemo, useState } from 'react'
import { calcularTotales, redondear } from '../utils/formato'

// Toda la lógica de la venta en curso (carrito, comprobante, totales, pago).
export function useVenta(productos) {
  const [items, setItems] = useState([]) // [{ id, cantidad }]
  const [tipoComprobante, setTipoComprobante] = useState('Boleta')
  const [cliente, setCliente] = useState('Cliente general')
  const [documentoCliente, setDocumentoCliente] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [recibido, setRecibido] = useState('')

  const lineas = useMemo(
    () =>
      items
        .map((item) => {
          const p = productos.find((x) => x.id === item.id)
          if (!p) return null
          return { ...p, cantidad: item.cantidad, importe: redondear(p.precio * item.cantidad) }
        })
        .filter(Boolean),
    [items, productos]
  )

  const unidades = lineas.reduce((suma, l) => suma + l.cantidad, 0)
  const bruto = lineas.reduce((suma, l) => suma + l.importe, 0)
  const totales = calcularTotales(bruto, 0)

  const recibidoNumero = parseFloat(recibido) || 0
  const vuelto = redondear(Math.max(0, recibidoNumero - totales.total))
  const puedeCobrar =
    lineas.length > 0 && (metodoPago !== 'efectivo' || recibidoNumero >= totales.total)

  function agregar(id) {
    const p = productos.find((x) => x.id === id)
    if (!p || p.stock === 0) return
    setItems((prev) => {
      const existente = prev.find((i) => i.id === id)
      if (!existente) return [...prev, { id, cantidad: 1 }]
      if (existente.cantidad >= p.stock) return prev
      return prev.map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i))
    })
  }

  function cambiarCantidad(id, delta) {
    const p = productos.find((x) => x.id === id)
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id) return [i]
        const nueva = i.cantidad + delta
        if (nueva <= 0) return []
        if (p && nueva > p.stock) return [i]
        return [{ ...i, cantidad: nueva }]
      })
    )
  }

  const quitar = (id) => setItems((prev) => prev.filter((i) => i.id !== id))
  const vaciar = () => setItems([])

  function reiniciar() {
    setItems([])
    setTipoComprobante('Boleta')
    setCliente('Cliente general')
    setDocumentoCliente('')
    setMetodoPago('efectivo')
    setRecibido('')
  }

  return {
    lineas,
    unidades,
    totales,
    tipoComprobante,
    setTipoComprobante,
    cliente,
    setCliente,
    documentoCliente,
    setDocumentoCliente,
    metodoPago,
    setMetodoPago,
    recibido,
    setRecibido,
    vuelto,
    puedeCobrar,
    agregar,
    cambiarCantidad,
    quitar,
    vaciar,
    reiniciar,
  }
}
