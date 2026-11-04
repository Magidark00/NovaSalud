import Badge from '../common/Badge'

export default function RecientesReposicion({ reposiciones }) {
  return (
    <section className="card repo-recientes" aria-label="Reposiciones recientes">
      <h2 className="repo-titulo">Reposiciones recientes</h2>
      <ul>
        {reposiciones.map((r) => (
          <li key={r.id}>
            <span className="repo-recientes__fecha">{r.fecha}</span>
            <span className="repo-recientes__producto">{r.producto}</span>
            <strong>{r.cantidad}</strong>
            <Badge estado={r.estado} />
          </li>
        ))}
      </ul>
    </section>
  )
}
