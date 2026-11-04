import { useMemo, useState } from 'react'
import { Download, Plus, ShoppingBag, UserPlus, Users } from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import StatCard from '../componentes/common/StatCard'
import StatsGrid from '../componentes/common/StatsGrid'
import CampoBusqueda from '../componentes/common/CampoBusqueda'
import Paginacion from '../componentes/common/Paginacion'
import TablaClientes from '../componentes/clientes/TablaClientes'
import DetalleCliente from '../componentes/clientes/DetalleCliente'
import { CLIENTES_EJEMPLO, RESUMEN_CLIENTES } from '../data/clientes'
import { normalizar } from '../utils/formato'
import './Clientes.css'

const POR_PAGINA = 4

export default function Clientes() {
  const [clientes, setClientes] = useState(CLIENTES_EJEMPLO)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [seleccionadoId, setSeleccionadoId] = useState(CLIENTES_EJEMPLO[0].id)

  const filtrados = useMemo(() => {
    const texto = busqueda.trim()
    if (!texto) return clientes
    const q = normalizar(texto)
    return clientes.filter((c) => normalizar(c.nombre).includes(q) || c.dni.includes(texto))
  }, [clientes, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const visibles = filtrados.slice(inicio, inicio + POR_PAGINA)
  const desde = filtrados.length ? inicio + 1 : 0

  const seleccionado = clientes.find((c) => c.id === seleccionadoId) ?? null

  // Cada vez que cambia la búsqueda se vuelve a la página 1
  function buscar(valor) {
    setBusqueda(valor)
    setPagina(1)
  }

  function eliminar(cliente) {
    if (window.confirm(`¿Eliminar a "${cliente.nombre}" de la lista de clientes?`)) {
      setClientes((prev) => prev.filter((c) => c.id !== cliente.id))
    }
  }

  // TODO: abrir el formulario de edición
  function editar() {}

  return (
    <>
      <PageHeader titulo="Clientes" estado={`${clientes.length} registrados`}>
        {/* TODO: exportar la lista a CSV / Excel */}
        <button type="button" className="btn btn--outline">
          <Download size={18} aria-hidden="true" />
          Exportar
        </button>
        {/* TODO: abrir el formulario de nuevo cliente */}
        <button type="button" className="btn btn--primary">
          <Plus size={18} aria-hidden="true" />
          Nuevo cliente
        </button>
      </PageHeader>

      <StatsGrid columnas={3}>
        <StatCard icono={Users} tono="teal" etiqueta="Total clientes" valor={clientes.length} valorColoreado />
        <StatCard
          icono={UserPlus}
          tono="teal"
          etiqueta="Nuevos este mes"
          valor={RESUMEN_CLIENTES.nuevosMes}
          nota={`▲ ${RESUMEN_CLIENTES.variacion}%`}
          notaAlLado
          valorColoreado
        />
        <StatCard icono={ShoppingBag} tono="teal" etiqueta="Compras del mes" valor={RESUMEN_CLIENTES.comprasMes} valorColoreado />
      </StatsGrid>

      <div className="clientes">
        <section className="card tabla-card" aria-label="Lista de clientes">
          <div className="clientes__buscar">
            <CampoBusqueda valor={busqueda} onChange={buscar} placeholder="Buscar por nombre o DNI..." />
          </div>
          <TablaClientes
            clientes={visibles}
            seleccionadoId={seleccionadoId}
            onSeleccionar={setSeleccionadoId}
            onEditar={editar}
            onEliminar={eliminar}
          />
          <Paginacion
            texto={`Mostrando ${desde}-${inicio + visibles.length} de ${filtrados.length}`}
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            onChange={setPagina}
          />
        </section>

        <DetalleCliente cliente={seleccionado} />
      </div>
    </>
  )
}
