import { Bell, ChevronDown, Search } from 'lucide-react'
import './Topbar.css'

export default function Topbar({ usuario = { iniciales: 'AD', rol: 'Administrador' } }) {
  return (
    <header className="topbar">
      <label className="topbar__search">
        <Search size={18} aria-hidden="true" />
        <input type="search" placeholder="Buscar producto o cliente" aria-label="Buscar producto o cliente" />
      </label>

      <div className="topbar__user">
        <button type="button" className="topbar__bell" aria-label="Notificaciones">
          <Bell size={20} aria-hidden="true" />
          <span className="topbar__bell-dot" />
        </button>
        <span className="topbar__divider" aria-hidden="true" />
        <button type="button" className="topbar__profile">
          <span className="topbar__avatar">{usuario.iniciales}</span>
          <span className="topbar__role">{usuario.rol}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}