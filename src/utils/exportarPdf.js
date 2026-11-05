import { formatSoles } from './formato'

function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Genera y abre el documento PDF / Impresión de un comprobante individual
 * (Boleta de Venta, Factura Electrónica o Nota de Venta)
 */
export function imprimirComprobantePdf(venta) {
  if (!venta) return

  const tituloTipo =
    venta.tipoComprobante === 'Factura'
      ? 'FACTURA ELECTRÓNICA'
      : venta.tipoComprobante === 'Nota de venta'
        ? 'NOTA DE VENTA'
        : 'BOLETA DE VENTA ELECTRÓNICA'

  const etiquetaDoc = venta.tipoComprobante === 'Factura' ? 'RUC' : 'DNI / Doc.'
  const detalles = Array.isArray(venta.detalles) ? venta.detalles : []

  const filasHtml = detalles
    .map(
      (d) => `
      <tr>
        <td>${escaparHtml(d.cantidad)}</td>
        <td>${escaparHtml(d.nombre)}</td>
        <td style="text-align:right">${escaparHtml(formatSoles(d.precioUnitario))}</td>
        <td style="text-align:right;font-weight:600">${escaparHtml(formatSoles(d.importe))}</td>
      </tr>
    `
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escaparHtml(venta.boleta)} - Nova Salud</title>
  <style>
    * { box-sizing: border-box; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    body { margin: 0; padding: 32px; color: #1f2937; background: #fff; }
    .sheet { max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; padding-bottom: 20px; border-bottom: 2px solid #178f85; }
    .brand h1 { margin: 0; color: #178f85; font-size: 26px; }
    .brand p { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
    .box { border: 2px solid #178f85; border-radius: 10px; padding: 12px 18px; text-align: center; min-width: 230px; }
    .box small { display: block; font-size: 12px; color: #6b7280; font-weight: 600; }
    .box strong { display: block; font-size: 14px; color: #178f85; margin: 4px 0; }
    .box span { display: block; font-size: 18px; font-weight: 700; color: #111827; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 10px; font-size: 13px; }
    .meta div strong { color: #4b5563; display: inline-block; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th { background: #dcf3f0; color: #14857a; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; }
    td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    .totals { margin-top: 20px; margin-left: auto; width: 280px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { border-top: 2px solid #178f85; margin-top: 6px; padding-top: 10px; font-size: 17px; font-weight: 700; color: #14857a; }
    .foot { margin-top: 28px; padding-top: 14px; border-top: 1px dashed #d1d5db; text-align: center; font-size: 12px; color: #6b7280; }
    @media print {
      body { padding: 0; }
      .sheet { border: 0; padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        <h1>+ Nova Salud</h1>
        <p>Botica y Farmacia · Sede Principal</p>
        <p>Av. Javier Prado Este 1420, Lima · Tel: (01) 480-2910</p>
      </div>
      <div class="box">
        <small>R.U.C. 20608945123</small>
        <strong>${escaparHtml(tituloTipo)}</strong>
        <span>${escaparHtml(venta.boleta)}</span>
      </div>
    </div>

    <div class="meta">
      <div><strong>Cliente:</strong> ${escaparHtml(venta.cliente)}</div>
      <div><strong>Fecha de emisión:</strong> ${escaparHtml(venta.fecha)}</div>
      <div><strong>${escaparHtml(etiquetaDoc)}:</strong> ${escaparHtml(venta.documentoCliente || '—')}</div>
      <div><strong>Método de pago:</strong> ${escaparHtml(venta.pago)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:70px">Cant.</th>
          <th>Descripción del medicamento / producto</th>
          <th style="text-align:right;width:120px">P. Unitario</th>
          <th style="text-align:right;width:120px">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${filasHtml || '<tr><td colspan="4">Detalle general de venta</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <div><span>Op. Gravada (Subtotal)</span><span>${escaparHtml(formatSoles(venta.subtotal))}</span></div>
      <div><span>I.G.V. (18%)</span><span>${escaparHtml(formatSoles(venta.igv))}</span></div>
      <div class="grand"><span>Importe Total</span><span>${escaparHtml(formatSoles(venta.total))}</span></div>
    </div>

    <div class="foot">
      Representación impresa del comprobante de venta · Botica Nova Salud · Gracias por su preferencia.
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 180);
    };
  </script>
</body>
</html>`

  const ventana = window.open('', '_blank', 'width=840,height=720')
  if (ventana) {
    ventana.document.open()
    ventana.document.write(html)
    ventana.document.close()
  }
}

/**
 * Genera y abre el Reporte Ejecutivo de Gestión de Ventas en PDF / Impresión
 */
export function imprimirResumenVentasPdf(ventas, resumen, subtituloFiltro = 'Todos los comprobantes') {
  const filasHtml = ventas
    .map(
      (v) => `
      <tr>
        <td><strong>${escaparHtml(v.boleta)}</strong></td>
        <td>${escaparHtml(v.tipoComprobante)}</td>
        <td>${escaparHtml(v.fecha)}</td>
        <td>${escaparHtml(v.cliente)}</td>
        <td>${escaparHtml(v.documentoCliente || '—')}</td>
        <td>${escaparHtml(v.pago)}</td>
        <td style="text-align:center">${escaparHtml(v.lineas)}</td>
        <td style="text-align:right">${escaparHtml(formatSoles(v.subtotal))}</td>
        <td style="text-align:right">${escaparHtml(formatSoles(v.igv))}</td>
        <td style="text-align:right;font-weight:700">${escaparHtml(formatSoles(v.total))}</td>
      </tr>
    `
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte de Gestión de Ventas - Nova Salud</title>
  <style>
    * { box-sizing: border-box; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    body { margin: 0; padding: 28px; color: #1f2937; background: #fff; }
    .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #178f85; padding-bottom: 14px; margin-bottom: 20px; }
    .head h1 { margin: 0; color: #178f85; font-size: 22px; }
    .head p { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; background: #f9fafb; }
    .kpi small { display: block; font-size: 11px; color: #6b7280; text-transform: uppercase; }
    .kpi strong { display: block; font-size: 18px; color: #14857a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #dcf3f0; color: #14857a; text-align: left; padding: 8px 10px; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <h1>+ Nova Salud · Reporte General de Ventas</h1>
      <p>Filtro aplicado: ${escaparHtml(subtituloFiltro)} · Emitido el ${escaparHtml(new Date().toLocaleString('es-PE'))}</p>
    </div>
    <div style="text-align:right;font-size:12px;color:#6b7280">
      <strong>R.U.C. 20608945123</strong><br/>
      Total registros: ${ventas.length}
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <small>Ingresos Totales</small>
      <strong>${escaparHtml(formatSoles(resumen.totalRecaudado))}</strong>
    </div>
    <div class="kpi">
      <small>Comprobantes</small>
      <strong>${resumen.boletas} Boletas · ${resumen.facturas} Facturas · ${resumen.notasVenta} Notas</strong>
    </div>
    <div class="kpi">
      <small>Ticket Promedio</small>
      <strong>${escaparHtml(formatSoles(resumen.ticketPromedio))}</strong>
    </div>
    <div class="kpi">
      <small>Digital vs. Efectivo</small>
      <strong>${escaparHtml(formatSoles(resumen.recaudacionDigital))} / ${escaparHtml(formatSoles(resumen.recaudacionEfectivo))}</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Comprobante</th>
        <th>Tipo</th>
        <th>Fecha</th>
        <th>Cliente</th>
        <th>DNI / RUC</th>
        <th>Pago</th>
        <th style="text-align:center">Unid.</th>
        <th style="text-align:right">Subtotal</th>
        <th style="text-align:right">IGV (18%)</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${filasHtml}
    </tbody>
  </table>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 180);
    };
  </script>
</body>
</html>`

  const ventana = window.open('', '_blank', 'width=980,height=740')
  if (ventana) {
    ventana.document.open()
    ventana.document.write(html)
    ventana.document.close()
  }
}
