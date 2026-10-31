import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './componentes/layout/Layout'
import Dashboard from './pages/Dashboard'
import Ventas from './pages/Ventas'
import EnConstruccion from './pages/EnConstruccion'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="inventario" element={<EnConstruccion titulo="Inventario" />} />
        <Route path="clientes" element={<EnConstruccion titulo="Clientes" />} />
        <Route path="reposicion" element={<EnConstruccion titulo="Reposición" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}