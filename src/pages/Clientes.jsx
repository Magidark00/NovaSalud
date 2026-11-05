import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Plus, ShoppingBag, UserPlus, Users, UserRoundPen, Trash2 } from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import StatCard from '../componentes/common/StatCard'
import StatsGrid from '../componentes/common/StatsGrid'
import CampoBusqueda from '../componentes/common/CampoBusqueda'
import Paginacion from '../componentes/common/Paginacion'
import TablaClientes from '../componentes/clientes/TablaClientes'
import DetalleCliente from '../componentes/clientes/DetalleCliente'
import { CLIENTES_EJEMPLO, RESUMEN_CLIENTES } from '../data/clientes'
import {
  apiActualizarCliente,
  apiCrearCliente,
  apiEliminarCliente,
  apiObtenerClientes,
} from '../services/api'
import { normalizar } from '../utils/formato'
import './Clientes.css'
import Dialogo from '../componentes/common/Dialogo'
import Toast from '../componentes/common/Toast'
import { exportarCsv } from '../utils/exportarCsv'

const POR_PAGINA = 4

export default function Clientes() {
  const [parametrosBusqueda, setParametrosBusqueda] = useSearchParams()
  const [clientes, setClientes] = useState(CLIENTES_EJEMPLO)
  const [resumen, setResumen] = useState(RESUMEN_CLIENTES)
  const busqueda = parametrosBusqueda.get('busqueda') ?? ''
  const setBusqueda = (valor) =>
    setParametrosBusqueda(
      (prev) => {
        const siguiente = new URLSearchParams(prev)
        if (valor) siguiente.set('busqueda', valor)
        else siguiente.delete('busqueda')
        return siguiente
      },
      { replace: true }
    )
  const [pagina, setPagina] = useState(1)
  const [seleccionadoId, setSeleccionadoId] = useState(CLIENTES_EJEMPLO[0].id)
  const [formulario, setFormulario] = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [aviso, setAviso] = useState('')

  const cargarClientes = useCallback(() => {
    apiObtenerClientes()
      .then((datos) => {
        if (Array.isArray(datos.clientes)) {
          setClientes(datos.clientes)
          if (datos.clientes.length > 0) {
            setSeleccionadoId((prev) =>
              datos.clientes.some((c) => c.id === prev) ? prev : datos.clientes[0].id
            )
          }
        }
        if (datos.resumen) setResumen(datos.resumen)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    cargarClientes()
  }, [cargarClientes])

  useEffect(() => {
    window.addEventListener('novasalud:venta-registrada', cargarClientes)
    return () => window.removeEventListener('novasalud:venta-registrada', cargarClientes)
  }, [cargarClientes])

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

  function buscar(valor) {
    setBusqueda(valor)
    setPagina(1)
  }

  function eliminar(cliente) {
    setConfirmar(cliente)
  }
  function editar(cliente) {
    const partes = cliente.nombre.trim().split(/\s+/)
    setFormulario({ ...cliente, nombres: partes.shift() ?? '', apellidos: partes.join(' ') })
  }

  async function guardar(e) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    const cambios = Object.fromEntries(datos.entries())
    const payload = {
      nombre: `${cambios.nombres} ${cambios.apellidos}`.trim(),
      dni: cambios.dni,
      telefono: cambios.telefono,
    }

    try {
      if (formulario.id) {
        const actualizado = await apiActualizarCliente(formulario.id, payload)
        setClientes((prev) => prev.map((c) => (c.id === actualizado.id ? actualizado : c)))
        setAviso('Cliente actualizado en la base de datos.')
      } else {
        const nuevo = await apiCrearCliente(payload)
        setClientes((prev) => [nuevo, ...prev])
        setSeleccionadoId(nuevo.id)
        setResumen((prev) => ({ ...prev, nuevosMes: prev.nuevosMes + 1 }))
        setAviso('Cliente registrado en la base de datos.')
      }
      setFormulario(null)
    } catch (err) {
      setAviso(err.message || 'No se pudo guardar el cliente.')
    }
  }

  async function confirmarEliminacion() {
    if (!confirmar) return
    const idAEliminar = confirmar.id
    setConfirmar(null)
    setClientes((prev) => prev.filter((c) => c.id !== idAEliminar))
    if (seleccionadoId === idAEliminar) setSeleccionadoId(null)
    setAviso('Cliente eliminado.')
    try {
      await apiEliminarCliente(idAEliminar)
    } catch {
      cargarClientes()
    }
  }

  return (
    <>
      <PageHeader titulo="Clientes" estado={`${clientes.length} registrados`}>
        <button
          type="button"
          className="btn btn--outline"
          onClick={() =>
            exportarCsv(
              'clientes-novasalud.csv',
              ['Nombre', 'DNI', 'Teléfono', 'Compras', 'Última compra', 'Total gastado'],
              clientes.map((c) => [c.nombre, c.dni, c.telefono, c.compras, c.ultimaCompra, c.totalGastado])
            )
          }
        >
          <Download size={18} aria-hidden="true" />
          Exportar
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setFormulario({ nombres: '', apellidos: '', dni: '', telefono: '' })}
        >
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
          valor={resumen.nuevosMes}
          nota={`▲ ${resumen.variacion}%`}
          notaAlLado
          valorColoreado
        />
        <StatCard icono={ShoppingBag} tono="teal" etiqueta="Compras del mes" valor={resumen.comprasMes} valorColoreado />
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
      {formulario && (
        <Dialogo
          titulo={formulario.id ? 'Editar cliente' : 'Nuevo cliente'}
          descripcion={
            formulario.id
              ? 'Mantén los datos de contacto de tu cliente al día.'
              : 'Registra los datos de contacto de tu cliente.'
          }
          icono={UserRoundPen}
          onCerrar={() => setFormulario(null)}
        >
          <form className="dialogo__form" onSubmit={guardar}>
            <div className="dialogo__grid">
              <label className="dialogo__campo">
                Nombres *
                <input
                  name="nombres"
                  required
                  value={formulario.nombres ?? ''}
                  onChange={(e) => setFormulario((p) => ({ ...p, nombres: e.target.value }))}
                />
              </label>
              <label className="dialogo__campo">
                Apellidos *
                <input
                  name="apellidos"
                  required
                  value={formulario.apellidos ?? ''}
                  onChange={(e) => setFormulario((p) => ({ ...p, apellidos: e.target.value }))}
                />
              </label>
            </div>
            <label className="dialogo__campo">
              DNI *
              <input
                name="dni"
                required
                inputMode="numeric"
                pattern="[0-9]{8}"
                title="Ingresa un DNI de 8 dígitos"
                value={formulario.dni}
                onChange={(e) => setFormulario((p) => ({ ...p, dni: e.target.value }))}
              />
            </label>
            <p className="dialogo__ayuda">Ingresa los 8 dígitos del documento.</p>
            <label className="dialogo__campo">
              Teléfono *
              <input
                name="telefono"
                required
                value={formulario.telefono}
                onChange={(e) => setFormulario((p) => ({ ...p, telefono: e.target.value }))}
              />
            </label>
            <p className="dialogo__ayuda">* Campos obligatorios.</p>
            {formulario.id && (
              <div className="dialogo__aviso dialogo__aviso--info">Su historial de compras no se modificará.</div>
            )}
            <div className="dialogo__acciones">
              <button type="button" className="btn btn--outline" onClick={() => setFormulario(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary">
                {formulario.id ? 'Guardar cambios' : 'Guardar cliente'}
              </button>
            </div>
          </form>
        </Dialogo>
      )}
      {confirmar && (
        <Dialogo
          titulo="¿Eliminar este cliente?"
          descripcion="El registro dejará de aparecer en la lista de clientes."
          icono={Trash2}
          tono="danger"
          onCerrar={() => setConfirmar(null)}
        >
          <div className="dialogo__form">
            <div className="dialogo__resumen">
              <small>Cliente</small>
              <strong>{confirmar.nombre}</strong>
              <p>
                DNI: {confirmar.dni} · Teléfono: {confirmar.telefono}
              </p>
              <p>Compras registradas: {confirmar.compras}</p>
            </div>
            <div className="dialogo__aviso">
              <strong>Esta acción no se puede deshacer.</strong>
              <br />
              El historial de compras existente se conservará.
            </div>
            <div className="dialogo__acciones">
              <button type="button" className="btn btn--outline" onClick={() => setConfirmar(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--danger" onClick={confirmarEliminacion}>
                Sí, eliminar cliente
              </button>
            </div>
          </div>
        </Dialogo>
      )}
      <Toast mensaje={aviso} onClose={() => setAviso('')} />
    </>
  )
}
