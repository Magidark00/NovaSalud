import './StatCard.css'

// tono: 'teal' | 'warning' | 'danger'
// valorColoreado: pinta el número con el color del tono
// notaAlLado: pone la nota junto al número en vez de debajo
export default function StatCard({
  icono: Icono,
  tono = 'teal',
  etiqueta,
  valor,
  nota,
  notaAlLado = false,
  valorColoreado = false,
}) {
  const claseValor = `stat-card__value${valorColoreado ? ` stat-card__value--${tono}` : ''}`

  return (
    <article className="stat-card card">
      <span className={`stat-card__icon stat-card__icon--${tono}`}>
        <Icono size={22} aria-hidden="true" />
      </span>
      <div>
        <p className="stat-card__label">{etiqueta}</p>
        <div className={notaAlLado ? 'stat-card__row' : undefined}>
          <p className={claseValor}>{valor}</p>
          {nota && <p className="stat-card__note">{nota}</p>}
        </div>
      </div>
    </article>
  )
}
