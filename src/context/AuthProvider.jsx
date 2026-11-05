import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'
import {
  apiLogin,
  apiVerificarSesion,
  guardarSesionLocal,
  limpiarSesionLocal,
  obtenerToken,
  obtenerUsuarioLocal,
} from '../services/api'

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerUsuarioLocal())
  const [cargando, setCargando] = useState(() => Boolean(obtenerToken()))

  const cerrarSesion = useCallback(() => {
    limpiarSesionLocal()
    setUsuario(null)
  }, [])

  useEffect(() => {
    const token = obtenerToken()
    if (!token) {
      return undefined
    }

    let activo = true
    apiVerificarSesion()
      .then((res) => {
        if (activo) setUsuario(res.usuario)
      })
      .catch(() => {
        if (activo) cerrarSesion()
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [cerrarSesion])

  useEffect(() => {
    const alExpirar = () => cerrarSesion()
    window.addEventListener('novasalud:unauthorized', alExpirar)
    return () => window.removeEventListener('novasalud:unauthorized', alExpirar)
  }, [cerrarSesion])

  async function iniciarSesion(username, password) {
    const datos = await apiLogin(username, password)
    guardarSesionLocal(datos.token, datos.usuario)
    setUsuario(datos.usuario)
    return datos.usuario
  }

  const valor = {
    usuario,
    autenticado: Boolean(usuario),
    cargando,
    iniciarSesion,
    cerrarSesion,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
