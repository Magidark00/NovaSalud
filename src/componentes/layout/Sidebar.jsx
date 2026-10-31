import { NavLink } from 'react-router-dom'
import {
  ClipboardPlus,
  LayoutDashboard,
  Package,
  Plus,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react'
import './Sidebar.css'

const MENU = [
  { to: '/', texto: 'Dashboard', Icono: LayoutDashboard, end: true },
  { to: '/ventas', texto: 'Ventas', Icono: ShoppingCart },
  { to: '/inventario', texto: 'Inventario', Icono: Package },
  { to: '/clientes', texto: 'Clientes', Icono: Users },
  { to: '/reposicion', texto: 'Reposición', Icono: ClipboardPlus },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Plus size={34} strokeWidth={5} aria-hidden="true" />
        <span className="sidebar__label">Nova Salud</span>
      </div>

      <nav className="sidebar__nav" aria-label="Principal">
        {MENU.map(({ to, texto, Icono, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={texto}
            className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
          >
            <Icono size={20} aria-hidden="true" />
            <span className="sidebar__label">{texto}</span>
            <span className="sidebar__dot" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <Store size={22} aria-hidden="true" />
        <div className="sidebar__label">
          <strong>Sede principal</strong>
          <span>Sistema conectado</span>
        </div>
        <span className="sidebar__status" aria-hidden="true" />
      </div>
    </aside>
  )
}