import { Router } from 'express'
import db from '../db.js'
import { respaldarEnSupabase } from '../supabase.js'
import { sanitizarTexto, verificarToken } from '../middleware/auth.js'

const router = Router()

router.use(verificarToken)

function calcularEstadoProducto(prod) {
  if (prod.stock === 0) return 'agotado'
  if (prod.stock <= prod.stock_minimo) return 'bajo'

  if (prod.vence && /^\d{4}-\d{2}$/.test(prod.vence)) {
    const [anio, mes] = prod.vence.split('-').map(Number)
    const ahora = new Date()
    const mesActual = ahora.getFullYear() * 12 + ahora.getMonth()
    const mesVence = anio * 12 + (mes - 1)
    const diff = mesVence - mesActual
    if (diff >= 0 && diff <= 3) {
      return 'porVencer'
    }
  }
  return 'normal'
}

function formatearFechaCorta(fechaIso) {
  if (!fechaIso) return '—'
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fechaIso))
  if (coincidencia) {
    return `${coincidencia[3]}/${coincidencia[2]}`
  }
  return String(fechaIso)
}

function obtenerDatosReposicion() {
  const todosProductos = db
    .prepare('SELECT id, nombre, proveedor, stock, stock_minimo, vence FROM productos WHERE activo = 1 ORDER BY stock ASC, id ASC')
    .all()

  let stockBajo = 0
  let agotados = 0
  let porVencer = 0
  const productosReponer = []

  for (const p of todosProductos) {
    const estado = calcularEstadoProducto(p)
    if (estado === 'agotado') agotados += 1
    else if (estado === 'bajo') stockBajo += 1
    else if (estado === 'porVencer') porVencer += 1

    if (['agotado', 'bajo', 'porVencer'].includes(estado)) {
      const sugerido = Math.max(15, p.stock_minimo * 2 - p.stock)
      productosReponer.push({
        id: p.id,
        nombre: p.nombre,
        proveedor: p.proveedor,
        stock: Number(p.stock),
        stockMin: Number(p.stock_minimo),
        sugerido,
        estado,
      })
    }
  }

  const filasRecientes = db
    .prepare(`
      SELECT
        dr.id AS detalleId,
        o.id AS ordenId,
        o.codigo AS codigoOrden,
        o.proveedor,
        o.fecha,
        o.estado,
        dr.producto_id AS productoId,
        dr.producto_nombre AS producto,
        dr.cantidad
      FROM detalle_reposicion dr
      INNER JOIN ordenes_reposicion o ON o.id = dr.orden_id
      ORDER BY o.id DESC, dr.id DESC
      LIMIT 30
    `)
    .all()

  const recientes = filasRecientes.map((r) => ({
    id: `r-${r.detalleId}`,
    detalleId: r.detalleId,
    ordenId: r.ordenId,
    codigoOrden: r.codigoOrden,
    proveedor: r.proveedor,
    fecha: formatearFechaCorta(r.fecha),
    producto: r.producto,
    cantidad: Number(r.cantidad),
    estado: r.estado,
  }))

  const pendientesRow = db
    .prepare("SELECT COUNT(*) AS count FROM ordenes_reposicion WHERE estado = 'pendiente'")
    .get()

  return {
    resumen: {
      stockBajo,
      agotados,
      porVencer,
      pedidosPendientes: Number(pendientesRow.count),
    },
    productosReponer,
    recientes,
  }
}

/**
 * GET /api/reposicion
 * Obtiene productos que requieren reposición en tiempo real, resumen e historial de órdenes
 */
router.get('/', (_req, res) => {
  return res.json(obtenerDatosReposicion())
})

/**
 * POST /api/reposicion
 * Genera nuevas órdenes de reposición agrupadas por proveedor en una transacción SQLite
 */
router.post('/', async (req, res) => {
  const grupos = Array.isArray(req.body?.grupos) ? req.body.grupos : []
  if (grupos.length === 0) {
    return res.status(400).json({ error: 'Selecciona al menos un producto para generar la orden.' })
  }

  try {
    db.exec('BEGIN IMMEDIATE TRANSACTION;')

    const insertOrden = db.prepare(`
      INSERT INTO ordenes_reposicion (codigo, proveedor, fecha, estado, usuario_id)
      VALUES (?, ?, date('now', 'localtime'), 'pendiente', ?)
    `)
    const insertDetalle = db.prepare(`
      INSERT INTO detalle_reposicion (orden_id, producto_id, producto_nombre, cantidad)
      VALUES (?, ?, ?, ?)
    `)

    let ordenesCreadas = 0
    const respaldos = []

    for (const g of grupos) {
      const proveedor = sanitizarTexto(g.proveedor || 'Proveedor general', 80)
      const items = Array.isArray(g.items) ? g.items : []
      if (items.length === 0) continue

      const codigo = `OR-${Date.now()}-${ordenesCreadas + 1}`
      const infoOrden = insertOrden.run(codigo, proveedor, req.usuario.id)
      ordenesCreadas += 1

      respaldos.push(
        respaldarEnSupabase('ordenes_reposicion', 'POST', {
          id: Number(infoOrden.lastInsertRowid),
          codigo,
          proveedor,
          estado: 'pendiente',
          usuario_id: req.usuario.id,
        })
      )

      for (const item of items) {
        const productoId = Number.isInteger(Number(item.id)) ? Number(item.id) : null
        const nombre = sanitizarTexto(item.nombre, 120)
        const cantidad = Math.max(1, Math.min(999, Number(item.cantidad) || 1))
        if (!nombre) continue
        const infoDet = insertDetalle.run(infoOrden.lastInsertRowid, productoId, nombre, cantidad)
        respaldos.push(
          respaldarEnSupabase('detalle_reposicion', 'POST', {
            id: Number(infoDet.lastInsertRowid),
            orden_id: Number(infoOrden.lastInsertRowid),
            producto_id: productoId,
            producto_nombre: nombre,
            cantidad,
          })
        )
      }
    }

    db.exec('COMMIT;')

    await Promise.all(respaldos)

    return res.status(201).json({
      ok: true,
      ordenesCreadas,
      ...obtenerDatosReposicion(),
    })
  } catch (err) {
    try {
      db.exec('ROLLBACK;')
    } catch {
      // Ignorar si ya cerró
    }
    return res.status(400).json({ error: err.message || 'No se pudo generar la orden de reposición.' })
  }
})

/**
 * PUT /api/reposicion/:ordenId/recibir
 * Marca una orden pendiente como recibida e incrementa automáticamente el stock en el inventario
 */
router.put('/:ordenId/recibir', async (req, res) => {
  const ordenId = Number(req.params.ordenId)
  if (!Number.isInteger(ordenId) || ordenId <= 0) {
    return res.status(400).json({ error: 'ID de orden inválido.' })
  }

  try {
    db.exec('BEGIN IMMEDIATE TRANSACTION;')

    const orden = db
      .prepare('SELECT id, estado FROM ordenes_reposicion WHERE id = ?')
      .get(ordenId)

    if (!orden) {
      throw new Error('Orden de reposición no encontrada.')
    }
    if (orden.estado === 'recibida') {
      throw new Error('Esta orden ya fue marcada como recibida.')
    }

    const detalles = db
      .prepare('SELECT producto_id, producto_nombre, cantidad FROM detalle_reposicion WHERE orden_id = ?')
      .all(ordenId)

    const updateStockPorId = db.prepare(
      "UPDATE productos SET stock = stock + ?, actualizado_en = datetime('now', 'localtime') WHERE id = ?"
    )
    const updateStockPorNombre = db.prepare(
      "UPDATE productos SET stock = stock + ?, actualizado_en = datetime('now', 'localtime') WHERE LOWER(nombre) = LOWER(?)"
    )

    for (const d of detalles) {
      if (d.producto_id) {
        updateStockPorId.run(Number(d.cantidad), Number(d.producto_id))
      } else {
        updateStockPorNombre.run(Number(d.cantidad), d.producto_nombre)
      }
    }

    db.prepare("UPDATE ordenes_reposicion SET estado = 'recibida' WHERE id = ?").run(ordenId)

    db.exec('COMMIT;')

    await respaldarEnSupabase('ordenes_reposicion', 'PATCH', { estado: 'recibida' }, `id=eq.${ordenId}`)

    return res.json({
      ok: true,
      ...obtenerDatosReposicion(),
    })
  } catch (err) {
    try {
      db.exec('ROLLBACK;')
    } catch {
      // Ignorar si ya cerró
    }
    return res.status(400).json({ error: err.message || 'No se pudo recibir la orden.' })
  }
})

export default router
