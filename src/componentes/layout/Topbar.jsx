import { Bell, ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventario } from '../../context/InventarioContext'
import { estadoProducto, normalizar } from '../../utils/formato'
import { CLIENTES_EJEMPLO } from '../../data/clientes'
import Dialogo from '../common/Dialogo'
import Badge from '../common/Badge'
import './Topbar.css'

export default function Topbar({ usuario = { iniciales: 'AD', rol: 'Administrador' } }) {
  const { productos } = useInventario()
  const [busqueda, setBusqueda] = useState('')
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [mostrarAvisos, setMostrarAvisos] = useState(false)
  const navegar = useNavigate()
  const resultados = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return q ? [...productos.filter(p => normalizar(p.nombre).includes(q) || p.codigo.includes(q)).map(item=>({...item,tipo:'producto'})), ...CLIENTES_EJEMPLO.filter(c=>normalizar(c.nombre).includes(q)||c.dni.includes(busqueda.trim())).map(item=>({...item,tipo:'cliente'}))].slice(0,6) : []
  }, [busqueda, productos])
  const alertas = productos.filter(p => ['bajo','agotado','porVencer'].includes(estadoProducto(p))).slice(0,5)
  return (
    <header className="topbar">
      <div className="topbar__search-wrap"><label className="topbar__search">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={busqueda} onChange={e=>{setBusqueda(e.target.value);setMostrarResultados(true)}} onFocus={()=>setMostrarResultados(true)} onKeyDown={e=>e.key==='Escape'&&setMostrarResultados(false)} placeholder="Buscar producto o cliente" aria-label="Buscar producto o cliente" />
      </label>{mostrarResultados && busqueda.trim() && <div className="topbar__popover">{resultados.length ? resultados.map(item=><button key={`${item.tipo}-${item.id}`} type="button" onClick={()=>{navegar({pathname:item.tipo==='producto'?'/inventario':'/clientes',search:`?busqueda=${encodeURIComponent(item.nombre)}`});setMostrarResultados(false);setBusqueda('')}}><strong>{item.nombre}</strong><small>{item.tipo==='producto'?`${item.codigo} · Stock ${item.stock}`:`Cliente · DNI ${item.dni}`}</small></button>) : <p>No se encontraron coincidencias.</p>}</div>}</div>

      <div className="topbar__user">
        <button type="button" className="topbar__bell" aria-label={`Notificaciones, ${alertas.length} alertas`} aria-expanded={mostrarAvisos} onClick={()=>setMostrarAvisos(v=>!v)}>
          <Bell size={20} aria-hidden="true" />
          {alertas.length > 0 && <span className="topbar__bell-dot" />}
        </button>
        <span className="topbar__divider" aria-hidden="true" />
        <button type="button" className="topbar__profile">
          <span className="topbar__avatar">{usuario.iniciales}</span>
          <span className="topbar__role">{usuario.rol}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>
      {mostrarAvisos && <Dialogo titulo="Hay productos por reponer" descripcion="Revisa los productos con disponibilidad crítica para mantener la atención de tus clientes." icono={Bell} tono="warning" onCerrar={()=>setMostrarAvisos(false)}><div className="dialogo__form"><div className="dialogo__contador">{alertas.length} productos requieren reposición <span>Ahora</span></div><div className="dialogo__aviso-lista">{alertas.slice(0,3).map(p=><div className="dialogo__aviso-item" key={p.id}><div><strong>{p.nombre}</strong><small>Stock: {p.stock} · Mínimo: {p.stockMinimo} · {p.proveedor}</small></div><Badge estado={estadoProducto(p)} /></div>)}</div><p className="dialogo__aviso-foot">En Reposición podrás revisar las cantidades sugeridas y generar una orden por proveedor.</p><div className="dialogo__acciones"><button className="btn btn--outline" onClick={()=>setMostrarAvisos(false)}>Más tarde</button><button className="btn btn--primary" onClick={()=>{navegar('/reposicion');setMostrarAvisos(false)}}>Ir a reposición</button></div></div></Dialogo>}
    </header>
  )
}
