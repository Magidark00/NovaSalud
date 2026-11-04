import PageHeader from '../componentes/common/PageHeader'

// Pantalla temporal para los módulos que aún no están diseñados
export default function EnConstruccion({ titulo }) {
  return (
    <>
      <PageHeader titulo={titulo} />
      <div className="card" style={{ padding: 32 }}>
        <p style={{ fontWeight: 600 }}>Esta pantalla todavía no está lista.</p>
        <p style={{ marginTop: 6, color: 'var(--muted)' }}>
          Aquí irá el módulo de {titulo.toLowerCase()}.
        </p>
      </div>
    </>
  )
}
