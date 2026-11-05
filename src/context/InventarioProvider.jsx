import { useCallback, useEffect, useState } from 'react'
import { InventarioContext } from './InventarioContext'
import { useAuth } from './AuthContext'
import { PRODUCTOS } from '../data/productos'
import {
  apiActualizarProducto,
  apiCrearProducto,
  apiEliminarProducto,
  apiObtenerProductos,
} from '../services/api'

export default function InventarioProvider({ children }) {
  const { autenticado } = useAuth()
  const [productos, setProductos] = useState(PRODUCTOS)

  const recargarProductos = useCallback(async () => {
    if (!autenticado) return
    try {
      const lista = await apiObtenerProductos()
      setProductos(lista)
    } catch {
      // Mantiene datos actuales si ocurre error temporal
    }
  }, [autenticado])

  useEffect(() => {
    if (!autenticado) return undefined
    let activo = true
    apiObtenerProductos()
      .then((lista) => {
        if (activo) setProductos(lista)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [autenticado])

  // lineas: [{ id, cantidad }]
  function descontarStock(lineas) {
    setProductos((prev) =>
      prev.map((p) => {
        const linea = lineas.find((l) => l.id === p.id)
        return linea ? { ...p, stock: Math.max(0, p.stock - linea.cantidad) } : p
      })
    )
  }

  async function eliminarProducto(id) {
    // Actualización optimista inmediata en la interfaz sin recargar la página
    setProductos((prev) => prev.filter((p) => Number(p.id) !== Number(id)))
    await apiEliminarProducto(id)
  }

  async function guardarProducto(producto) {
    if (producto.id) {
      const actualizado = await apiActualizarProducto(producto.id, producto)
      setProductos((prev) => prev.map((p) => (Number(p.id) === Number(actualizado.id) ? actualizado : p)))
      return actualizado
    } else {
      const creado = await apiCrearProducto(producto)
      setProductos((prev) => [...prev, creado])
      return creado
    }
  }

  const valor = {
    productos,
    recargarProductos,
    descontarStock,
    eliminarProducto,
    guardarProducto,
  }

  return <InventarioContext.Provider value={valor}>{children}</InventarioContext.Provider>
}
