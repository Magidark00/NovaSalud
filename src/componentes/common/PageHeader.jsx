import './PageHeader.css'

// tono de la etiqueta de estado: 'success' (verde) | 'warning' (naranja)
export default function PageHeader({ titulo, estado, tono = 'success', children }) {
  return (
    <header className="page-header">
      <div className="page-header__title">
        <h1>{titulo}</h1>
        {estado && (
          <span className={`status-pill status-pill--${tono}`}>
            <span className="status-pill__dot" aria-hidden="true" />
            {estado}
          </span>
        )}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </header>
  )
}
