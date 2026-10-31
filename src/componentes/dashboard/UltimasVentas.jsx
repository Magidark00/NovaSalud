import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { formatSoles } from '../../utils/formato'
import './Panel.css'

export default function UltimasVentas({ ventas }) {
  return (
    <section className="panel card" aria-label="Últimas ventas">
      <div className="panel__head">
        <h2>Últimas ventas</h2>
        <Link to="/ventas" className="panel__link">
          Ver todas <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <table className="tabla">
        <thead>
          <tr>
            <th>Código</th>
            <th>Total</th>
            <th>Pago</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.codigo}>
              <td>{v.codigo}</td>
              <td className="tabla__total">{formatSoles(v.total)}</td>
              <td className="tabla__pago">{v.pago}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}