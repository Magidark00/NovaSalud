import { createContext, useContext } from 'react'

export const PosContext = createContext(null)

export function usePos() {
  const contexto = useContext(PosContext)
  if (!contexto) {
    throw new Error('usePos debe usarse dentro de <PosProvider>')
  }
  return contexto
}
