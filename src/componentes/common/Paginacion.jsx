import { ChevronLeft, ChevronRight } from 'lucide-react'
import './Paginacion.css'

function paginasVisibles(actual, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (actual <= 3) return [1, 2, 3, '…', total]
  if (actual >= total - 2) return [1, '…', total - 2, total - 1, total]
  return [1, '…', actual, '…', total]
}

export default function Paginacion({ texto, pagina, totalPaginas, onChange }) {
  return (
    <div className="paginacion">
      <span>{texto}</span>
      <nav className="paginacion__nav" aria-label="Paginación">
        <button
          type="button"
          className="paginacion__btn"
          onClick={() => onChange(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {paginasVisibles(pagina, totalPaginas).map((p, i) =>
          p === '…' ? (
            <span key={`p-${i}`} className="paginacion__gap">…</span>
          ) : (
            <button
              key={`p-${i}`}
              type="button"
              className={`paginacion__btn${p === pagina ? ' is-active' : ''}`}
              aria-current={p === pagina ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className="paginacion__btn"
          onClick={() => onChange(pagina + 1)}
          disabled={pagina >= totalPaginas}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </nav>
    </div>
  )
}
