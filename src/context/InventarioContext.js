import { createContext, useContext } from 'react'

export const InventarioContext = createContext(null)

export function useInventario() {
  const contexto = useContext(InventarioContext)
  if (!contexto) {
    throw new Error('useInventario debe usarse dentro de <InventarioProvider>')
  }
  return contexto
}
