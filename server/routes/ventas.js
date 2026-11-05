import { Router } from 'express'
import db from '../db.js'
import { respaldarEnSupabase } from '../supabase.js'
import { sanitizarTexto, verificarToken } from '../middleware/auth.js'

const router = Router()

router.use(verificarToken)

function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100
}

function obtenerSiguienteComprobante(tipoComprobante) {
  const prefijos = {
    Boleta: { serie: 'B001', base: 460 },
    Factura: { serie: 'F001', base: 101 },
    'Nota de venta': { serie: 'NV01', base: 201 },
  }
  const config = prefijos[tipoComprobante] || prefijos.Boleta
  const filas = db
    .prepare('SELECT codigo_boleta FROM ventas WHERE codigo_boleta LIKE ?')
    .all(`${config.serie}-%`)

  let maxCorr = config.base
  for (const f of filas) {
    const partes = String(f.codigo_boleta).split('-')
    const num = Number(partes[1])
    if (Number.isInteger(num) && num > maxCorr) {
      maxCorr = num
    }
  }
  const siguiente = maxCorr + 1
  return `${config.serie}-${String(siguiente).padStart(6, '0')}`
}

function construirEstadoVentas() {
  const filasVentas = db
    .prepare(`
      SELECT
        v.id,
        v.numero_boleta AS numeroBoleta,
        v.codigo_boleta AS boleta,
        v.tipo_comprobante AS tipoComprobante,
        v.documento_cliente AS documentoCliente,
        v.cliente_nombre AS cliente,
        v.metodo_pago AS pago,
        v.subtotal,
        v.igv,
        v.descuento,
        v.total,
        v.recibido,
        v.vuelto,
        v.fecha
      FROM ventas v
      ORDER BY v.id DESC
      LIMIT 100
    `)
    .all()

  const stmtDetalles = db.prepare(`
    SELECT
      id,
      producto_id AS productoId,
      producto_nombre AS nombre,
      cantidad,
      precio_unitario AS precioUnitario,
      importe
    FROM detalle_ventas
    WHERE venta_id = ?
    ORDER BY id ASC
  `)

  let totalRecaudado = 0
  let boletas = 0
  let facturas = 0
  let notasVenta = 0
  let unidadesVendidas = 0
  let recaudacionEfectivo = 0
  let recaudacionDigital = 0

  const historial = filasVentas.map((v) => {
    const detalles = stmtDetalles.all(v.id).map((d) => ({
      id: d.id,
      productoId: d.productoId,
      nombre: d.nombre,
      cantidad: Number(d.cantidad),
      precioUnitario: Number(d.precioUnitario),
      importe: Number(d.importe),
    }))
    const lineas = detalles.reduce((acc, item) => acc + item.cantidad, 0)
    const tipo =
      v.tipoComprobante ||
      (String(v.boleta).startsWith('F')
        ? 'Factura'
        : String(v.boleta).startsWith('NV')
          ? 'Nota de venta'
          : 'Boleta')

    const monto = Number(v.total)
    totalRecaudado = redondear(totalRecaudado + monto)
    unidadesVendidas += lineas

    if (tipo === 'Factura') facturas += 1
    else if (tipo === 'Nota de venta') notasVenta += 1
    else boletas += 1

    if (v.pago === 'Efectivo') {
      recaudacionEfectivo = redondear(recaudacionEfectivo + monto)
    } else {
      recaudacionDigital = redondear(recaudacionDigital + monto)
    }

    return {
      id: v.id,
      numeroBoleta: v.numeroBoleta,
      boleta: v.boleta,
      tipoComprobante: tipo,
      documentoCliente: v.documentoCliente || '—',
      cliente: v.cliente || 'Cliente general',
      pago: v.pago,
      subtotal: Number(v.subtotal),
      igv: Number(v.igv),
      descuento: Number(v.descuento || 0),
      total: monto,
      recibido: Number(v.recibido || monto),
      vuelto: Number(v.vuelto || 0),
      fecha: v.fecha,
      lineas,
      detalles,
    }
  })

  const totalComprobantes = historial.length
  const ticketPromedio = totalComprobantes > 0 ? redondear(totalRecaudado / totalComprobantes) : 0

  const maxRow = db.prepare('SELECT COALESCE(MAX(numero_boleta), 460) AS maxNum FROM ventas').get()
  const siguienteBoleta = Number(maxRow.maxNum) + 1

  const correlativos = {
    Boleta: obtenerSiguienteComprobante('Boleta'),
    Factura: obtenerSiguienteComprobante('Factura'),
    'Nota de venta': obtenerSiguienteComprobante('Nota de venta'),
  }

  const clientesPrincipales = db
    .prepare('SELECT nombre, dni FROM clientes ORDER BY id ASC LIMIT 25')
    .all()

  return {
    siguienteBoleta,
    correlativos,
    clientes: ['Cliente general', ...clientesPrincipales.map((c) => c.nombre)],
    clientesDetalle: clientesPrincipales,
    resumen: {
      totalRecaudado,
      totalComprobantes,
      boletas,
      facturas,
      notasVenta,
      ticketPromedio,
      unidadesVendidas,
      recaudacionEfectivo,
      recaudacionDigital,
    },
    historial,
  }
}

/**
 * GET /api/ventas
 * Devuelve el historial completo con detalles, correlativos por tipo de comprobante y KPIs de gestión
 */
router.get('/', (_req, res) => {
  return res.json(construirEstadoVentas())
})

/**
 * POST /api/ventas
 * Registra una nueva venta (Boleta, Factura o Nota de venta) en una transacción atómica
 */
router.post('/', async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  const clienteNombre = sanitizarTexto(req.body?.cliente || 'Cliente general', 120) || 'Cliente general'
  const documentoInput = sanitizarTexto(req.body?.documentoCliente || '', 20)
  const tipoInput = sanitizarTexto(req.body?.tipoComprobante || 'Boleta', 30)
  const tiposValidos = ['Boleta', 'Factura', 'Nota de venta']
  const tipoComprobante = tiposValidos.includes(tipoInput) ? tipoInput : 'Boleta'

  const metodoRaw = sanitizarTexto(req.body?.metodoPago || 'efectivo', 30).toLowerCase()
  const mapaPago = {
    efectivo: 'Efectivo',
    yape: 'Yape',
    plin: 'Plin',
    tarjeta: 'Tarjeta',
  }
  const metodoPago = mapaPago[metodoRaw] || 'Efectivo'
  const recibidoInput = Number(req.body?.recibido) || 0

  if (items.length === 0) {
    return res.status(400).json({ error: 'El carrito de venta está vacío.' })
  }

  for (const item of items) {
    if (!Number.isInteger(Number(item.id)) || !Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) <= 0) {
      return res.status(400).json({ error: 'Cantidades o productos inválidos en la venta.' })
    }
  }

  try {
    db.exec('BEGIN IMMEDIATE TRANSACTION;')

    const selectProducto = db.prepare(
      'SELECT id, nombre, precio, stock FROM productos WHERE id = ? AND activo = 1'
    )
    const updateStock = db.prepare(
      "UPDATE productos SET stock = stock - ?, actualizado_en = datetime('now', 'localtime') WHERE id = ?"
    )

    let totalBruto = 0
    const lineasProcesadas = []

    for (const item of items) {
      const prod = selectProducto.get(Number(item.id))
      if (!prod) {
        throw new Error(`El producto con ID ${item.id} no existe o está inactivo.`)
      }
      const cantidad = Number(item.cantidad)
      if (prod.stock < cantidad) {
        throw new Error(`Stock insuficiente para "${prod.nombre}" (Disponible: ${prod.stock}).`)
      }

      const importe = redondear(prod.precio * cantidad)
      totalBruto = redondear(totalBruto + importe)
      lineasProcesadas.push({
        productoId: prod.id,
        nombre: prod.nombre,
        cantidad,
        precio: prod.precio,
        importe,
        nuevoStock: prod.stock - cantidad,
      })

      updateStock.run(cantidad, prod.id)
    }

    const total = totalBruto
    const subtotal = redondear(total / 1.18)
    const igv = redondear(total - subtotal)
    const recibido = metodoPago === 'Efectivo' ? Math.max(total, recibidoInput) : total
    const vuelto = metodoPago === 'Efectivo' ? redondear(Math.max(0, recibido - total)) : 0

    const maxRow = db.prepare('SELECT COALESCE(MAX(numero_boleta), 460) AS maxNum FROM ventas').get()
    const numeroBoleta = Number(maxRow.maxNum) + 1
    const codigoBoleta = obtenerSiguienteComprobante(tipoComprobante)

    const clienteRow = db
      .prepare('SELECT id, dni FROM clientes WHERE LOWER(nombre) = LOWER(?) LIMIT 1')
      .get(clienteNombre)
    const clienteId = clienteRow?.id ?? null
    const documentoFinal = documentoInput || clienteRow?.dni || (tipoComprobante === 'Factura' ? '20100000001' : '00000000')

    const infoVenta = db
      .prepare(`
        INSERT INTO ventas (
          numero_boleta, codigo_boleta, tipo_comprobante, documento_cliente,
          cliente_id, cliente_nombre, usuario_id,
          metodo_pago, subtotal, igv, descuento, total, recibido, vuelto, fecha
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, datetime('now', 'localtime'))
      `)
      .run(
        numeroBoleta,
        codigoBoleta,
        tipoComprobante,
        documentoFinal,
        clienteId,
        clienteNombre,
        req.usuario.id,
        metodoPago,
        subtotal,
        igv,
        total,
        recibido,
        vuelto
      )

    const insertDetalle = db.prepare(`
      INSERT INTO detalle_ventas (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, importe)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const detallesGuardados = []
    for (const l of lineasProcesadas) {
      const infoDet = insertDetalle.run(
        infoVenta.lastInsertRowid,
        l.productoId,
        l.nombre,
        l.cantidad,
        l.precio,
        l.importe
      )
      detallesGuardados.push({
        id: Number(infoDet.lastInsertRowid),
        productoId: l.productoId,
        nombre: l.nombre,
        cantidad: l.cantidad,
        precioUnitario: l.precio,
        importe: l.importe,
      })
    }

    if (clienteId) {
      db.prepare(`
        UPDATE clientes
        SET compras = compras + 1,
            ultima_compra = date('now', 'localtime'),
            total_gastado = ROUND(total_gastado + ?, 2)
        WHERE id = ?
      `).run(total, clienteId)
    }

    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const diaHoy = diasSemana[new Date().getDay()]
    db.prepare('UPDATE ventas_semanales_resumen SET ventas = ROUND(ventas + ?, 2) WHERE dia = ?').run(total, diaHoy)

    db.exec('COMMIT;')

    await Promise.all([
      respaldarEnSupabase('ventas', 'POST', {
        id: Number(infoVenta.lastInsertRowid),
        numero_boleta: numeroBoleta,
        codigo_boleta: codigoBoleta,
        cliente_id: clienteId,
        cliente_nombre: clienteNombre,
        usuario_id: req.usuario.id,
        metodo_pago: metodoPago,
        subtotal,
        igv,
        descuento: 0,
        total,
        recibido,
        vuelto,
      }),
      ...detallesGuardados.map((d) =>
        respaldarEnSupabase('detalle_ventas', 'POST', {
          id: d.id,
          venta_id: Number(infoVenta.lastInsertRowid),
          producto_id: d.productoId,
          producto_nombre: d.nombre,
          cantidad: d.cantidad,
          precio_unitario: d.precioUnitario,
          importe: d.importe,
        })
      ),
      ...lineasProcesadas.map((l) =>
        respaldarEnSupabase('productos', 'PATCH', { stock: l.nuevoStock }, `id=eq.${l.productoId}`)
      ),
    ])

    const estadoActualizado = construirEstadoVentas()
    const ventaRecienCreada = estadoActualizado.historial.find(
      (v) => v.id === Number(infoVenta.lastInsertRowid)
    )

    return res.status(201).json({
      venta: ventaRecienCreada,
      ...estadoActualizado,
    })
  } catch (err) {
    try {
      db.exec('ROLLBACK;')
    } catch {
      // Ignorar si ya cerró
    }
    return res.status(400).json({ error: err.message || 'No se pudo procesar la venta.' })
  }
})

export default router
