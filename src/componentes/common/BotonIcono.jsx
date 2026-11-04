import './BotonIcono.css'

// tono: 'teal' | 'danger'
export default function BotonIcono({ icono: Icono, etiqueta, tono = 'teal', onClick }) {
  return (
    <button
      type="button"
      className={`boton-icono boton-icono--${tono}`}
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
    >
      <Icono size={16} aria-hidden="true" />
    </button>
  )
}
