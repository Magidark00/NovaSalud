import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Badge from '../common/Badge'
import './Panel.css'

export default function AlertasReposicion({ alertas }) {
  return (
    <section className="panel card" aria-label="Alertas de reposición">
      <div className="panel__head">
        <h2>Alertas de reposición</h2>
        <Link to="/inventario" className="panel__link">
          Ver inventario <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <ul className="alertas">
        {alertas.map((a) => (
          <li key={a.id} className="alertas__item">
            <span className="alertas__nombre">{a.producto}</span>
            <span className="alertas__detalle">{a.detalle}</span>
            <Badge estado={a.estado} />
          </li>
        ))}
      </ul>
    </section>
  )
}