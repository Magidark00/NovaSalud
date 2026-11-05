import { Router } from 'express'
import db from '../db.js'
import { respaldarEnSupabase } from '../supabase.js'
import { sanitizarTexto, verificarToken } from '../middleware/auth.js'

const router = Router()

router.use(verificarToken)

function formatBoletaServer(numero) {
  return `B001-${String(numero).padStart(6, '0')}`
}

function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100
}

/**
 * GET /api/ventas
 * Devuelve el historial de ventas, el siguiente correlativo de boleta y los clientes frecuentes
 */
router.get('/', (_req, res) => {
  const filasVentas = db
    .prepare(`
      SELECT
        v.id,
        v.numero_boleta AS numeroBoleta,
        v.codigo_boleta AS boleta,
        v.cliente_nombre AS cliente,
        v.metodo_pago AS pago,
        v.subtotal,
        v.igv,
        v.descuento,
        v.total,
        v.fecha,
        (SELECT COALESCE(SUM(dv.cantidad), 0) FROM detalle_ventas dv WHERE dv.venta_id = v.id) AS lineas
      FROM ventas v
      ORDER BY v.id DESC
      LIMIT 50
    `)
    .all()

  const maxRow = db.prepare('SELECT COALESCE(MAX(numero_boleta), 460) AS maxNum FROM ventas').get()
  const siguienteBoleta = Number(maxRow.maxNum) + 1

  const clientesPrincipales = db
    .prepare('SELECT nombre FROM clientes ORDER BY id ASC LIMIT 10')
    .all()
    .map((c) => c.nombre)

  return res.json({
    siguienteBoleta,
    clientes: ['Cliente general', ...clientesPrincipales],
    historial: filasVentas,
  })
})

/**
 * POST /api/ventas
 * Registra una venta de forma transaccional y atómica:
 * 1. Verifica stock disponible de cada producto
 * 2. Descuenta el stock en tiempo real
 * 3. Registra la cabecera y el detalle de la boleta
 * 4. Actualiza estadísticas del cliente y ventas semanales del dashboard
 */
router.post('/', async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  const clienteNombre = sanitizarTexto(req.body?.cliente || 'Cliente general', 100) || 'Cliente general'
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
    const codigoBoleta = formatBoletaServer(numeroBoleta)

    const clienteRow = db
      .prepare('SELECT id FROM clientes WHERE LOWER(nombre) = LOWER(?) LIMIT 1')
      .get(clienteNombre)
    const clienteId = clienteRow?.id ?? null

    const infoVenta = db
      .prepare(`
        INSERT INTO ventas (
          numero_boleta, codigo_boleta, cliente_id, cliente_nombre, usuario_id,
          metodo_pago, subtotal, igv, descuento, total, recibido, vuelto, fecha
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, datetime('now', 'localtime'))
      `)
      .run(
        numeroBoleta,
        codigoBoleta,
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

    let totalUnidades = 0
    for (const l of lineasProcesadas) {
      totalUnidades += l.cantidad
      insertDetalle.run(infoVenta.lastInsertRowid, l.productoId, l.nombre, l.cantidad, l.precio, l.importe)
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

    // Actualizar el día correspondiente en el gráfico semanal del Dashboard
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const diaHoy = diasSemana[new Date().getDay()]
    db.prepare('UPDATE ventas_semanales_resumen SET ventas = ROUND(ventas + ?, 2) WHERE dia = ?').run(total, diaHoy)

    db.exec('COMMIT;')

    // Respaldar en Supabase si está activo
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
      ...lineasProcesadas.map((l) =>
        respaldarEnSupabase('productos', 'PATCH', { stock: l.nuevoStock }, `id=eq.${l.productoId}`)
      ),
    ])

    return res.status(201).json({
      venta: {
        id: infoVenta.lastInsertRowid,
        numeroBoleta,
        boleta: codigoBoleta,
        cliente: clienteNombre,
        pago: metodoPago,
        total,
        lineas: totalUnidades,
        fecha: new Date().toLocaleString('es-PE'),
      },
      siguienteBoleta: numeroBoleta + 1,
    })
  } catch (err) {
    try {
      db.exec('ROLLBACK;')
    } catch {
      // Ignorar si la transacción ya se cerró
    }
    return res.status(400).json({ error: err.message || 'No se pudo procesar la venta.' })
  }
})

export default router
