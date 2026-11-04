import './FiltroCategorias.css'

// `suave`: variante para usarla dentro de una tarjeta (Inventario y Reposición)
export default function FiltroCategorias({ categorias, activa, onChange, suave = false }) {
  return (
    <div className={`chips${suave ? ' chips--suave' : ''}`} role="group" aria-label="Filtros">
      {categorias.map((cat) => (
        <button
          key={cat}
          type="button"
          className={`chips__chip${cat === activa ? ' is-active' : ''}`}
          aria-pressed={cat === activa}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
