import { useCallback, useEffect, useState } from 'react'
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
import { usePos } from '../context/PosContext'
import { apiObtenerDashboard } from '../services/api'
import { formatSoles } from '../utils/formato'
import './Dashboard.css'

export default function Dashboard() {
  const { abrirPos } = usePos()
  const [datos, setDatos] = useState({
    resumen: RESUMEN,
    ventasSemana: VENTAS_SEMANA,
    alertasReposicion: ALERTAS_REPOSICION,
    ultimasVentas: ULTIMAS_VENTAS,
  })

  const cargarDashboard = useCallback(() => {
    apiObtenerDashboard()
      .then((respuesta) => setDatos(respuesta))
      .catch(() => {})
  }, [])

  useEffect(() => {
    cargarDashboard()
  }, [cargarDashboard])

  useEffect(() => {
    window.addEventListener('novasalud:venta-registrada', cargarDashboard)
    return () => window.removeEventListener('novasalud:venta-registrada', cargarDashboard)
  }, [cargarDashboard])

  const { resumen, ventasSemana, alertasReposicion, ultimasVentas } = datos

  return (
    <>
      <PageHeader titulo="Dashboard" estado="En vivo">
        <button type="button" className="btn btn--primary" onClick={() => abrirPos()}>
          <Plus size={18} aria-hidden="true" />
          Nueva venta
        </button>
      </PageHeader>

      <section className="dashboard__stats" aria-label="Resumen del día">
        <StatCard
          icono={ShoppingCart}
          tono="teal"
          etiqueta="Ventas de hoy"
          valor={formatSoles(resumen.ventasHoy)}
          nota={`▲ ${resumen.variacion}% vs ayer`}
        />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Stock bajo" valor={resumen.stockBajo} />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Por vencer" valor={resumen.porVencer} />
        <StatCard icono={CircleX} tono="danger" etiqueta="Agotados" valor={resumen.agotados} />
      </section>

      <SalesChart datos={ventasSemana} />

      <div className="dashboard__bottom">
        <AlertasReposicion alertas={alertasReposicion} />
        <UltimasVentas ventas={ultimasVentas} />
      </div>
    </>
  )
}
