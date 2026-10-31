import './FiltroCategorias.css'

export default function FiltroCategorias({ categorias, activa, onChange }) {
  return (
    <div className="chips" role="group" aria-label="Categorías">
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