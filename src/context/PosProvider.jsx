import { useCallback, useState } from 'react'
import { PosContext } from './PosContext'
import ModalPos from '../componentes/ventas/ModalPos'

export default function PosProvider({ children }) {
  const [abierto, setAbierto] = useState(false)
  const [clientePreseleccionado, setClientePreseleccionado] = useState(null)

  const abrirPos = useCallback((opciones = {}) => {
    setClientePreseleccionado(opciones.cliente || null)
    setAbierto(true)
  }, [])

  const cerrarPos = useCallback(() => {
    setAbierto(false)
    setClientePreseleccionado(null)
  }, [])

  return (
    <PosContext.Provider value={{ abierto, abrirPos, cerrarPos }}>
      {children}
      {abierto && (
        <ModalPos
          clienteInicial={clientePreseleccionado}
          onCerrar={cerrarPos}
        />
      )}
    </PosContext.Provider>
  )
}
