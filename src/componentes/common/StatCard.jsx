import './StatCard.css'

// tono: 'teal' | 'warning' | 'danger'
export default function StatCard({ icono: Icono, tono = 'teal', etiqueta, valor, nota }) {
  return (
    <article className="stat-card card">
      <span className={`stat-card__icon stat-card__icon--${tono}`}>
        <Icono size={22} aria-hidden="true" />
      </span>
      <div>
        <p className="stat-card__label">{etiqueta}</p>
        <p className="stat-card__value">{valor}</p>
        {nota && <p className="stat-card__note">{nota}</p>}
      </div>
    </article>
  )
}