import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CircleX, Download, Package, Plus, TriangleAlert, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import StatCard from '../componentes/common/StatCard'
import StatsGrid from '../componentes/common/StatsGrid'
import Paginacion from '../componentes/common/Paginacion'
import FiltrosInventario from '../componentes/inventario/FiltrosInventario'
import TablaInventario from '../componentes/inventario/TablaInventario'
import { useInventario } from '../context/InventarioContext'
import { estadoProducto, normalizar } from '../utils/formato'
import Dialogo from '../componentes/common/Dialogo'
import Toast from '../componentes/common/Toast'
import { exportarCsv } from '../utils/exportarCsv'

const POR_PAGINA = 5
const ESTADOS = {
  Normal: 'normal',
  'Stock bajo': 'bajo',
  'Por vencer': 'porVencer',
  Agotado: 'agotado',
}
const FILTROS_ESTADO = ['Todos', ...Object.keys(ESTADOS)]

export default function Inventario() {
  const [parametrosBusqueda, setParametrosBusqueda] = useSearchParams()
  const { productos, eliminarProducto, guardarProducto } = useInventario()
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
  const [categoria, setCategoria] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [estado, setEstado] = useState('Todos')
  const [pagina, setPagina] = useState(1)
  const [formulario, setFormulario] = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [aviso, setAviso] = useState('')

  const cambiar = (setter) => (valor) => {
    setter(valor)
    setPagina(1)
  }

  const categorias = useMemo(() => [...new Set(productos.map((p) => p.categoria))], [productos])
  const proveedores = useMemo(() => [...new Set(productos.map((p) => p.proveedor))], [productos])

  const conteo = useMemo(() => {
    const total = { bajo: 0, porVencer: 0, agotado: 0 }
    productos.forEach((p) => {
      const e = estadoProducto(p)
      if (e in total) total[e] += 1
    })
    return total
  }, [productos])

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return productos.filter((p) => {
      const coincideTexto = !q || normalizar(p.nombre).includes(q) || p.codigo.includes(q)
      return (
        coincideTexto &&
        (!categoria || p.categoria === categoria) &&
        (!proveedor || p.proveedor === proveedor) &&
        (estado === 'Todos' || estadoProducto(p) === ESTADOS[estado])
      )
    })
  }, [productos, busqueda, categoria, proveedor, estado])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const visibles = filtrados.slice(inicio, inicio + POR_PAGINA)
  const desde = filtrados.length ? inicio + 1 : 0

  function eliminar(producto) {
    setConfirmar(producto)
  }
  function editar(producto) {
    setFormulario(producto)
  }
  const vacio = {
    nombre: '',
    presentacion: '',
    categoria: '',
    proveedor: '',
    precio: '',
    stock: '',
    stockMinimo: '',
    vence: '',
  }

  async function guardar(e) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const producto = Object.fromEntries(data.entries())
    producto.id = formulario?.id
    producto.codigo = formulario?.codigo ?? `NS${Date.now()}`
    for (const campo of ['precio', 'stock', 'stockMinimo']) producto[campo] = Number(producto[campo])
    try {
      await guardarProducto(producto)
      setFormulario(null)
      setAviso(formulario?.id ? 'Producto actualizado.' : 'Producto registrado.')
    } catch (err) {
      setAviso(err.message || 'No se pudo guardar el producto.')
    }
  }

  async function confirmarEliminacion() {
    if (!confirmar) return
    const idAEliminar = confirmar.id
    setConfirmar(null)
    try {
      await eliminarProducto(idAEliminar)
      setAviso('Producto eliminado del inventario.')
    } catch (err) {
      setAviso(err.message || 'No se pudo eliminar el producto.')
    }
  }

  return (
    <>
      <PageHeader titulo="Inventario" estado={`${productos.length} productos`}>
        <button
          type="button"
          className="btn btn--outline"
          onClick={() =>
            exportarCsv(
              'inventario-novasalud.csv',
              ['Código', 'Producto', 'Presentación', 'Categoría', 'Proveedor', 'Stock', 'Stock mínimo', 'Precio', 'Vence'],
              productos.map((p) => [
                p.codigo,
                p.nombre,
                p.presentacion,
                p.categoria,
                p.proveedor,
                p.stock,
                p.stockMinimo,
                p.precio,
                p.vence,
              ])
            )
          }
        >
          <Download size={18} aria-hidden="true" />
          Exportar
        </button>
        <button type="button" className="btn btn--primary" onClick={() => setFormulario(vacio)}>
          <Plus size={18} aria-hidden="true" />
          Nuevo producto
        </button>
      </PageHeader>

      <StatsGrid>
        <StatCard icono={Package} tono="teal" etiqueta="Total productos" valor={productos.length} valorColoreado />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Stock bajo" valor={conteo.bajo} valorColoreado />
        <StatCard icono={TriangleAlert} tono="warning" etiqueta="Por vencer" valor={conteo.porVencer} valorColoreado />
        <StatCard icono={CircleX} tono="danger" etiqueta="Agotados" valor={conteo.agotado} valorColoreado />
      </StatsGrid>

      <FiltrosInventario
        busqueda={busqueda}
        onBusqueda={cambiar(setBusqueda)}
        categoria={categoria}
        onCategoria={cambiar(setCategoria)}
        categorias={categorias}
        proveedor={proveedor}
        onProveedor={cambiar(setProveedor)}
        proveedores={proveedores}
        estados={FILTROS_ESTADO}
        estado={estado}
        onEstado={cambiar(setEstado)}
      />

      <section className="card tabla-card" aria-label="Lista de productos">
        <TablaInventario productos={visibles} onEditar={editar} onEliminar={eliminar} />
        <Paginacion
          texto={`Mostrando ${desde}-${inicio + visibles.length} de ${filtrados.length}`}
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          onChange={setPagina}
        />
      </section>
      {formulario && (
        <Dialogo
          titulo={formulario.id ? 'Editar producto' : 'Nuevo producto'}
          descripcion={
            formulario.id
              ? 'Actualiza la información del producto en tu inventario.'
              : 'Completa la información del producto para agregarlo al inventario.'
          }
          icono={Pencil}
          onCerrar={() => setFormulario(null)}
        >
          <form className="dialogo__form" onSubmit={guardar}>
            <div className="dialogo__grid">
              {[
                ['nombre', 'Nombre del producto'],
                ['presentacion', 'Presentación'],
                ['categoria', 'Categoría'],
                ['proveedor', 'Proveedor'],
                ['stock', 'Stock actual'],
                ['stockMinimo', 'Stock mínimo'],
                ['precio', 'Precio de venta (S/)'],
                ['vence', 'Vencimiento'],
              ].map(([name, label]) => (
                <label className="dialogo__campo" key={name}>
                  {label} *
                  {name === 'categoria' || name === 'proveedor' ? (
                    <select
                      name={name}
                      required
                      value={formulario[name] ?? ''}
                      onChange={(e) => setFormulario((p) => ({ ...p, [name]: e.target.value }))}
                    >
                      <option value="">Selecciona {name === 'categoria' ? 'una categoría' : 'un proveedor'}</option>
                      {(name === 'categoria' ? categorias : proveedores).map((opcion) => (
                        <option key={opcion} value={opcion}>
                          {opcion}
                        </option>
                      ))}
                      {formulario[name] &&
                        !(name === 'categoria' ? categorias : proveedores).includes(formulario[name]) && (
                          <option value={formulario[name]}>{formulario[name]}</option>
                        )}
                    </select>
                  ) : (
                    <input
                      name={name}
                      required
                      value={formulario[name] ?? ''}
                      onChange={(e) => setFormulario((p) => ({ ...p, [name]: e.target.value }))}
                      type={
                        ['stock', 'stockMinimo', 'precio'].includes(name)
                          ? 'number'
                          : name === 'vence'
                            ? 'month'
                            : 'text'
                      }
                      min={['stock', 'stockMinimo', 'precio'].includes(name) ? '0' : undefined}
                      step={name === 'precio' ? '0.01' : undefined}
                    />
                  )}
                </label>
              ))}
            </div>
            <p className="dialogo__ayuda">* Campos obligatorios · Precio expresado en soles.</p>
            <div className="dialogo__acciones">
              <button type="button" className="btn btn--outline" onClick={() => setFormulario(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary">
                {formulario.id ? 'Guardar cambios' : 'Guardar producto'}
              </button>
            </div>
          </form>
        </Dialogo>
      )}
      {confirmar && (
        <Dialogo
          titulo="¿Eliminar este producto?"
          descripcion="El producto dejará de estar disponible en el inventario y no podrás seleccionarlo en nuevas ventas."
          icono={Trash2}
          tono="danger"
          onCerrar={() => setConfirmar(null)}
        >
          <div className="dialogo__form">
            <div className="dialogo__resumen">
              <small>Producto</small>
              <strong>{confirmar.nombre}</strong>
              <p>
                {confirmar.presentacion} · {confirmar.categoria} · {confirmar.proveedor}
              </p>
              <p>Stock actual: {confirmar.stock} unidades</p>
            </div>
            <div className="dialogo__aviso">
              <strong>Esta acción no se puede deshacer.</strong>
              <br />
              Las ventas ya registradas se conservarán en el historial.
            </div>
            <div className="dialogo__acciones">
              <button type="button" className="btn btn--outline" onClick={() => setConfirmar(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--danger" onClick={confirmarEliminacion}>
                Sí, eliminar producto
              </button>
            </div>
          </div>
        </Dialogo>
      )}
      <Toast mensaje={aviso} onClose={() => setAviso('')} />
    </>
  )
}
