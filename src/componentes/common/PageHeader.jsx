import './PageHeader.css'

// Título de la pantalla + etiqueta de estado opcional + acciones a la derecha (children)
export default function PageHeader({ titulo, estado, children }) {
  return (
    <header className="page-header">
      <div className="page-header__title">
        <h1>{titulo}</h1>
        {estado && (
          <span className="status-pill">
            <span className="status-pill__dot" aria-hidden="true" />
            {estado}
          </span>
        )}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </header>
  )
}