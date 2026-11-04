import './StatsGrid.css'

export default function StatsGrid({ columnas = 4, children }) {
  return (
    <section className="stats-grid" style={{ '--columnas': columnas }}>
      {children}
    </section>
  )
}
