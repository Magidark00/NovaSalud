import { Download, FileText, Printer } from 'lucide-react'
import Dialogo from '../common/Dialogo'
import { exportarCsv } from '../../utils/exportarCsv'
import { imprimirComprobantePdf } from '../../utils/exportarPdf'
import { formatSoles } from '../../utils/formato'
import './ModalDetalleVenta.css'

export default function ModalDetalleVenta({ venta, onCerrar }) {
  if (!venta) return null

  const detalles = Array.isArray(venta.detalles) ? venta.detalles : []
  const etiquetaDocumento = venta.tipoComprobante === 'Factura' ? 'RUC' : 'DNI / Doc.'

  function descargarCsvComprobante() {
    const cabeceras = [
      'Comprobante',
      'Tipo',
      'Fecha',
      'Cliente',
      'Documento',
      'Método de Pago',
      'Medicamento / Producto',
      'Cantidad',
      'Precio Unitario',
      'Importe Línea',
    ]
    const filas = detalles.length
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
      : [
          [
            venta.boleta,
            venta.tipoComprobante,
            venta.fecha,
            venta.cliente,
            venta.documentoCliente || '—',
            venta.pago,
            'Venta general',
            venta.lineas,
            venta.total,
            venta.total,
          ],
        ]

    exportarCsv(`comprobante-${venta.boleta}.csv`, cabeceras, filas)
  }

  return (
    <Dialogo
      titulo={`${venta.tipoComprobante} · ${venta.boleta}`}
      descripcion="Detalle oficial del comprobante emitido y desglose de productos vendidos."
      icono={FileText}
      ancho="ancho"
      onCerrar={onCerrar}
    >
      <div className="comprobante-modal">
        <div className="comprobante-modal__cabecera">
          <div>
            <span className={`tipo-pill tipo-pill--${venta.tipoComprobante === 'Factura' ? 'factura' : venta.tipoComprobante === 'Nota de venta' ? 'nota' : 'boleta'}`}>
              {venta.tipoComprobante}
            </span>
            <h3 className="comprobante-modal__cliente">{venta.cliente}</h3>
            <p className="comprobante-modal__sub">
              {etiquetaDocumento}: <strong>{venta.documentoCliente || '—'}</strong> · Emitido: <strong>{venta.fecha}</strong>
            </p>
          </div>
          <div className="comprobante-modal__pago-box">
            <small>Método de pago</small>
            <strong>{venta.pago}</strong>
            <span>{venta.lineas} {venta.lineas === 1 ? 'unidad' : 'unidades'}</span>
          </div>
        </div>

        <div className="comprobante-modal__tabla-wrap">
          <table className="dialogo__tabla">
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Medicamento / Producto</th>
                <th style={{ textAlign: 'right' }}>P. Unitario</th>
                <th style={{ textAlign: 'right' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {detalles.length > 0 ? (
                detalles.map((item) => (
                  <tr key={item.id || item.nombre}>
                    <td><strong>{item.cantidad}</strong></td>
                    <td>{item.nombre}</td>
                    <td style={{ textAlign: 'right' }}>{formatSoles(item.precioUnitario)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatSoles(item.importe)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>{venta.lineas}</td>
                  <td>Productos farmacéuticos varios</td>
                  <td style={{ textAlign: 'right' }}>{formatSoles(venta.total)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatSoles(venta.total)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="comprobante-modal__totales">
          <div>
            <span>Op. Gravada (Subtotal)</span>
            <strong>{formatSoles(venta.subtotal)}</strong>
          </div>
          <div>
            <span>I.G.V. (18%)</span>
            <strong>{formatSoles(venta.igv)}</strong>
          </div>
          <div className="comprobante-modal__total-final">
            <span>Importe Total</span>
            <strong>{formatSoles(venta.total)}</strong>
          </div>
        </div>

        <div className="dialogo__acciones comprobante-modal__acciones">
          <button type="button" className="btn btn--outline" onClick={descargarCsvComprobante}>
            <Download size={17} aria-hidden="true" />
            Exportar CSV
          </button>
          <button type="button" className="btn btn--primary" onClick={() => imprimirComprobantePdf(venta)}>
            <Printer size={17} aria-hidden="true" />
            Descargar PDF / Imprimir
          </button>
        </div>
      </div>
    </Dialogo>
  )
}
