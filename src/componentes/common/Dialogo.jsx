import { X } from 'lucide-react'
import './Dialogo.css'

export default function Dialogo({ titulo, descripcion, children, onCerrar, ancho = 'normal', icono: Icono, tono = 'teal' }) {
  return (
    <div className="dialogo__fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <section className={`dialogo dialogo--${ancho} dialogo--${tono}`} role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo">
        <header className="dialogo__cabecera">
          <div className="dialogo__titulos">{Icono && <span className="dialogo__icono"><Icono size={23} aria-hidden="true" /></span>}<h2 id="dialogo-titulo">{titulo}</h2>{descripcion && <p>{descripcion}</p>}</div>
          <button type="button" className="dialogo__cerrar" onClick={onCerrar} aria-label="Cerrar"><X size={20} /></button>
        </header>
        {children}
      </section>
    </div>
  )
}
