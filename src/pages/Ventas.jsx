import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Plus,
  Printer,
  Receipt,
} from 'lucide-react'
import PageHeader from '../componentes/common/PageHeader'
import StatCard from '../componentes/common/StatCard'
import StatsGrid from '../componentes/common/StatsGrid'
import CampoBusqueda from '../componentes/common/CampoBusqueda'
import Selector from '../componentes/common/Selector'
import Paginacion from '../componentes/common/Paginacion'
import BotonIcono from '../componentes/common/BotonIcono'
import Toast from '../componentes/common/Toast'
import ModalDetalleVenta from '../componentes/ventas/ModalDetalleVenta'
import { usePos } from '../context/PosContext'
import { apiObtenerVentas } from '../services/api'
import { exportarCsv } from '../utils/exportarCsv'
import { imprimirComprobantePdf, imprimirResumenVentasPdf } from '../utils/exportarPdf'
import { formatSoles, normalizar, redondear } from '../utils/formato'
import '../componentes/common/Tabla.css'
import './Ventas.css'

const POR_PAGINA = 6
const TIPOS_FILTRO = ['Todos', 'Boleta', 'Factura', 'Nota de venta']
const PAGOS_FILTRO = ['Efectivo', 'Yape', 'Plin', 'Tarjeta']

export default function Ventas() {
  const { abrirPos } = usePos()
  const [historial, setHistorial] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [tipoComprobante, setTipoComprobante] = useState('Todos')
  const [metodoPago, setMetodoPago] = useState('')
  const [pagina, setPagina] = useState(1)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [aviso, setAviso] = useState('')

  const cargarVentas = useCallback(() => {
    apiObtenerVentas()
      .then((datos) => {
        if (Array.isArray(datos.historial)) {
          setHistorial(datos.historial)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    cargarVentas()
  }, [cargarVentas])

  useEffect(() => {
    const alRegistrar = (e) => {
      if (e.detail?.historial) {
        setHistorial(e.detail.historial)
      } else {
        cargarVentas()
      }
    }
    window.addEventListener('novasalud:venta-registrada', alRegistrar)
    return () => window.removeEventListener('novasalud:venta-registrada', alRegistrar)
  }, [cargarVentas])

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return historial.filter((v) => {
      const coincideTexto =
        !q ||
        normalizar(v.boleta).includes(q) ||
        normalizar(v.cliente).includes(q) ||
        normalizar(v.documentoCliente).includes(q)
      const coincideTipo = tipoComprobante === 'Todos' || v.tipoComprobante === tipoComprobante
      const coincidePago = !metodoPago || v.pago === metodoPago
      return coincideTexto && coincideTipo && coincidePago
    })
  }, [historial, busqueda, tipoComprobante, metodoPago])

  // KPIs calculados dinámicamente sobre los comprobantes filtrados
  const metricas = useMemo(() => {
    let totalRecaudado = 0
    let boletas = 0
    let facturas = 0
    let notasVenta = 0
    let recaudacionEfectivo = 0
    let recaudacionDigital = 0
    let unidadesVendidas = 0

    filtradas.forEach((v) => {
      const monto = Number(v.total) || 0
      totalRecaudado = redondear(totalRecaudado + monto)
      unidadesVendidas += Number(v.lineas) || 0

      if (v.tipoComprobante === 'Factura') facturas += 1
      else if (v.tipoComprobante === 'Nota de venta') notasVenta += 1
      else boletas += 1

      if (v.pago === 'Efectivo') {
        recaudacionEfectivo = redondear(recaudacionEfectivo + monto)
      } else {
        recaudacionDigital = redondear(recaudacionDigital + monto)
      }
    })

    const totalComprobantes = filtradas.length
    const ticketPromedio = totalComprobantes > 0 ? redondear(totalRecaudado / totalComprobantes) : 0

    return {
      totalRecaudado,
      totalComprobantes,
      boletas,
      facturas,
      notasVenta,
      ticketPromedio,
      unidadesVendidas,
      recaudacionEfectivo,
      recaudacionDigital,
    }
  }, [filtradas])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const visibles = filtradas.slice(inicio, inicio + POR_PAGINA)
  const desde = filtradas.length ? inicio + 1 : 0

  function exportarReporteCsv() {
    if (filtradas.length === 0) {
      setAviso('No hay comprobantes en el filtro actual para exportar.')
      return
    }
    const sufijo = tipoComprobante === 'Todos' ? 'general' : normalizar(tipoComprobante).replace(/\s+/g, '-')
    exportarCsv(
      `reporte-ventas-${sufijo}.csv`,
      [
        'Comprobante',
        'Tipo',
        'Fecha',
        'Cliente',
        'DNI / RUC',
        'Método de Pago',
        'Unidades',
        'Subtotal (S/)',
        'IGV 18% (S/)',
        'Total (S/)',
      ],
      filtradas.map((v) => [
        v.boleta,
        v.tipoComprobante,
        v.fecha,
        v.cliente,
        v.documentoCliente || '—',
        v.pago,
        v.lineas,
        v.subtotal,
        v.igv,
        v.total,
      ])
    )
    setAviso(`Se exportaron ${filtradas.length} comprobantes a CSV.`)
  }

  function exportarCsvIndividual(venta) {
    const detalles = Array.isArray(venta.detalles) ? venta.detalles : []
    exportarCsv(
      `comprobante-${venta.boleta}.csv`,
      ['Comprobante', 'Tipo', 'Fecha', 'Cliente', 'Documento', 'Pago', 'Producto', 'Cantidad', 'P. Unitario', 'Importe'],
      detalles.length
        ? detalles.map((d) => [
            venta.boleta,
            venta.tipoComprobante,
            venta.fecha,
            venta.cliente,
            venta.documentoCliente || '—',
            venta.pago,
            d.nombre,
            d.cantidad,
            d.precioUnitario,
            d.importe,
          ])
        : [[venta.boleta, venta.tipoComprobante, venta.fecha, venta.cliente, venta.documentoCliente || '—', venta.pago, 'Venta general', venta.lineas, venta.total, venta.total]]
    )
    setAviso(`CSV del comprobante ${venta.boleta} descargado.`)
  }

  function exportarResumenPdf() {
    if (filtradas.length === 0) {
      setAviso('No hay comprobantes para generar el resumen PDF.')
      return
    }
    const descripcionFiltro = `${tipoComprobante}${metodoPago ? ` · ${metodoPago}` : ''}`
    imprimirResumenVentasPdf(filtradas, metricas, descripcionFiltro)
  }

  return (
    <>
      <PageHeader titulo="Gestión de Ventas" estado={`${historial.length} comprobantes`}>
        <button type="button" className="btn btn--outline" onClick={exportarResumenPdf}>
          <Printer size={18} aria-hidden="true" />
          Resumen PDF
        </button>
        <button type="button" className="btn btn--outline" onClick={exportarReporteCsv}>
          <Download size={18} aria-hidden="true" />
          Exportar CSV
        </button>
        <button type="button" className="btn btn--primary" onClick={() => abrirPos()}>
          <Plus size={18} aria-hidden="true" />
          Registrar venta (POS)
        </button>
      </PageHeader>

      <StatsGrid columnas={4}>
        <StatCard
          icono={Receipt}
          tono="teal"
          etiqueta="Ingresos registrados"
          valor={formatSoles(metricas.totalRecaudado)}
          nota={`Ticket prom. ${formatSoles(metricas.ticketPromedio)}`}
          valorColoreado
        />
        <StatCard
          icono={FileText}
          tono="teal"
          etiqueta="Comprobantes emitidos"
          valor={metricas.totalComprobantes}
          nota={`${metricas.boletas} Bol · ${metricas.facturas} Fac · ${metricas.notasVenta} NV`}
          valorColoreado
        />
        <StatCard
          icono={CreditCard}
          tono="teal"
          etiqueta="Pagos digitales"
          valor={formatSoles(metricas.recaudacionDigital)}
          nota="Yape · Plin · Tarjeta"
          valorColoreado
        />
        <StatCard
          icono={Banknote}
          tono="teal"
          etiqueta="Pagos en efectivo"
          valor={formatSoles(metricas.recaudacionEfectivo)}
          nota={`${metricas.unidadesVendidas} unid. despachadas`}
          valorColoreado
        />
      </StatsGrid>

      <div className="ventas-filtros">
        <CampoBusqueda
          valor={busqueda}
          onChange={(val) => {
            setBusqueda(val)
            setPagina(1)
          }}
          placeholder="Buscar por N° comprobante (B001, F001, NV01), cliente o DNI/RUC..."
        />

        <div className="ventas-filtros__tipos" role="group" aria-label="Filtrar por tipo de comprobante">
          {TIPOS_FILTRO.map((t) => (
            <button
              key={t}
              type="button"
              className={`ventas-filtros__chip${tipoComprobante === t ? ' is-active' : ''}`}
              onClick={() => {
                setTipoComprobante(t)
                setPagina(1)
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <Selector
          valor={metodoPago}
          onChange={(val) => {
            setMetodoPago(val)
            setPagina(1)
          }}
          opciones={PAGOS_FILTRO}
          placeholder="Todos los pagos"
          ariaLabel="Filtrar por método de pago"
        />
      </div>

      <section className="card tabla-card" aria-label="Registro de comprobantes de venta">
        <div className="data-table__scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Comprobante</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Cliente / Documento</th>
                <th>Unid.</th>
                <th>Método Pago</th>
                <th>Subtotal</th>
                <th>IGV (18%)</th>
                <th>Total</th>
                <th className="data-table__acciones-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={10} className="data-table__vacio">
                    No se encontraron comprobantes con los filtros seleccionados.
                  </td>
                </tr>
              )}

              {visibles.map((v) => {
                const claseTipo =
                  v.tipoComprobante === 'Factura'
                    ? 'factura'
                    : v.tipoComprobante === 'Nota de venta'
                      ? 'nota'
                      : 'boleta'
                return (
                  <tr key={v.boleta} onClick={() => setVentaSeleccionada(v)} style={{ cursor: 'pointer' }}>
                    <td className="data-table__codigo">
                      <strong>{v.boleta}</strong>
                    </td>
                    <td>
                      <span className={`tipo-pill tipo-pill--${claseTipo}`}>{v.tipoComprobante}</span>
                    </td>
                    <td className="data-table__gris">{v.fecha}</td>
                    <td>
                      <div className="ventas-tabla__cliente">
                        <strong>{v.cliente}</strong>
                        <small>{v.documentoCliente && v.documentoCliente !== '00000000' ? `Doc: ${v.documentoCliente}` : 'Sin documento'}</small>
                      </div>
                    </td>
                    <td>{v.lineas}</td>
                    <td>{v.pago}</td>
                    <td className="data-table__gris">{formatSoles(v.subtotal)}</td>
                    <td className="data-table__gris">{formatSoles(v.igv)}</td>
                    <td className="data-table__precio">{formatSoles(v.total)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="data-table__acciones">
                        <BotonIcono
                          icono={Eye}
                          etiqueta={`Ver detalle de ${v.boleta}`}
                          onClick={() => setVentaSeleccionada(v)}
                        />
                        <BotonIcono
                          icono={FileSpreadsheet}
                          etiqueta={`Descargar CSV de ${v.boleta}`}
                          onClick={() => exportarCsvIndividual(v)}
                        />
                        <BotonIcono
                          icono={Printer}
                          etiqueta={`Imprimir o guardar PDF de ${v.boleta}`}
                          onClick={() => imprimirComprobantePdf(v)}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Paginacion
          texto={`Mostrando ${desde}-${inicio + visibles.length} de ${filtradas.length} comprobantes`}
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          onChange={setPagina}
        />
      </section>

      <ModalDetalleVenta
        venta={ventaSeleccionada}
        onCerrar={() => setVentaSeleccionada(null)}
      />

      <Toast mensaje={aviso} onClose={() => setAviso('')} />
    </>
  )
}
