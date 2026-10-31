import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatSoles } from '../../utils/formato'
import './SalesChart.css'

const EJE = { fill: '#6b7280', fontSize: 12 }

export default function SalesChart({ datos }) {
  return (
    <section className="sales-chart card" aria-label="Ventas de la semana">
      <div className="sales-chart__head">
        <h2>Ventas de la semana</h2>
        <p>
          <span className="sales-chart__legend" aria-hidden="true" />
          Ventas (S/) <span className="sales-chart__period">Esta semana</span>
        </p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={datos} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="ventasRelleno" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a9e92" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#1a9e92" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ecdfd8" />
          <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={EJE} />
          <YAxis
            domain={[0, 800]}
            ticks={[0, 200, 400, 600, 800]}
            tickLine={false}
            axisLine={false}
            tick={EJE}
          />
          <Tooltip formatter={(valor) => [formatSoles(valor), 'Ventas']} />
          <Area
            type="linear"
            dataKey="ventas"
            stroke="#1a9e92"
            strokeWidth={2}
            fill="url(#ventasRelleno)"
            dot={{ r: 3, fill: '#1a9e92', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  )
}