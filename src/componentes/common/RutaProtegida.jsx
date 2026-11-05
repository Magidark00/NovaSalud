import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RutaProtegida() {
  const { autenticado, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'var(--teal-700)', fontWeight: 600 }}>
        Verificando sesión segura...
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: ubicacion }} replace />
  }

  return <Outlet />
}
