import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import InventarioProvider from './context/InventarioProvider'
import PosProvider from './context/PosProvider'
import RutaProtegida from './componentes/common/RutaProtegida'
import Layout from './componentes/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ventas from './pages/Ventas'
import Inventario from './pages/Inventario'
import Clientes from './pages/Clientes'
import Reposicion from './pages/Reposicion'

export default function App() {
  return (
    <AuthProvider>
      <InventarioProvider>
        <PosProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RutaProtegida />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="ventas" element={<Ventas />} />
                <Route path="inventario" element={<Inventario />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="reposicion" element={<Reposicion />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </PosProvider>
      </InventarioProvider>
    </AuthProvider>
  )
}
