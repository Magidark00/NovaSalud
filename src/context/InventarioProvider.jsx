import { useState } from 'react'
import { InventarioContext } from './InventarioContext'
import { PRODUCTOS } from '../data/productos'

// Estado compartido de productos.
// Cuando exista el backend, estas funciones llamarán a la API.
export default function InventarioProvider({ children }) {
  const [productos, setProductos] = useState(PRODUCTOS)

  // lineas: [{ id, cantidad }] (lo que devuelve useVenta)
  function descontarStock(lineas) {
    setProductos((prev) =>
      prev.map((p) => {
        const linea = lineas.find((l) => l.id === p.id)
        return linea ? { ...p, stock: p.stock - linea.cantidad } : p
      }),
    )
  }

  function eliminarProducto(id) {
    setProductos((prev) => prev.filter((p) => p.id !== id))
  }

  const valor = { productos, descontarStock, eliminarProducto }

  return <InventarioContext.Provider value={valor}>{children}</InventarioContext.Provider>
}
