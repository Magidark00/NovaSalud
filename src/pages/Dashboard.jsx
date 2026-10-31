import { Link } from 'react-router-dom'
import { CircleX, Plus, ShoppingCart, TriangleAlert } from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import StatCard from '../componentes/common/StatCard'
import SalesChart from '../componentes/dashboard/SalesChart'
import AlertasReposicion from '../componentes/dashboard/AlertasReposicion'
import UltimasVentas from '../componentes/dashboard/UltimasVentas'
import {
  ALERTAS_REPOSICION,
  RESUMEN,
  ULTIMAS_VENTAS,
  VENTAS_SEMANA,
} from '../data/dashboard'
import { formatSoles } from '../utils/formato'
import './Dashboard.css'

export default function Dashboard() {
  return (
    <>
      <PageHeader titulo="Dashboard" estado="En vivo">
        <Link to="/ventas" className="btn btn--primary">
          <Plus size={18} aria-hidden="true" />
          Nueva venta
        </Link>
      </PageHeader>

      <section className="dashboard__stats" aria-label="Resumen del día">
        <StatCard
          icono={ShoppingCart}
          tono="teal"
          etiqueta="Ventas de hoy"
          valor={formatSoles(RESUMEN.ventasHoy)}
          nota={`▲ ${RESUMEN.variacion}% vs ayer`}
        />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Stock bajo" valor={RESUMEN.stockBajo} />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Por vencer" valor={RESUMEN.porVencer} />
        <StatCard icono={CircleX} tono="danger" etiqueta="Agotados" valor={RESUMEN.agotados} />
      </section>

      <SalesChart datos={VENTAS_SEMANA} />

      <div className="dashboard__bottom">
        <AlertasReposicion alertas={ALERTAS_REPOSICION} />
        <UltimasVentas ventas={ULTIMAS_VENTAS} />
      </div>
    </>
  )
}