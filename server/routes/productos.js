import { Router } from 'express'
import db from '../db.js'
import { respaldarEnSupabase } from '../supabase.js'
import { sanitizarTexto, verificarToken } from '../middleware/auth.js'

const router = Router()

// Todas las rutas de inventario requieren autenticación JWT
router.use(verificarToken)

function mapearProducto(fila) {
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    presentacion: fila.presentacion,
    categoria: fila.categoria,
    proveedor: fila.proveedor,
    precio: Number(fila.precio),
    stock: Number(fila.stock),
    stockMinimo: Number(fila.stock_minimo),
    vence: fila.vence,
  }
}

/**
 * GET /api/productos
 * Obtiene todos los productos activos del inventario con filtros opcionales seguros
 */
router.get('/', (req, res) => {
  const busqueda = sanitizarTexto(req.query.busqueda ?? '', 100)
  const categoria = sanitizarTexto(req.query.categoria ?? '', 80)
  const proveedor = sanitizarTexto(req.query.proveedor ?? '', 80)

  let sql = `
    SELECT id, codigo, nombre, presentacion, categoria, proveedor, precio, stock, stock_minimo, vence
    FROM productos
    WHERE activo = 1
  `
  const params = []

  if (busqueda) {
    sql += ' AND (LOWER(nombre) LIKE ? OR codigo LIKE ?)'
    const patron = `%${busqueda.toLowerCase()}%`
    params.push(patron, patron)
  }

  if (categoria && categoria !== 'Todos') {
    sql += ' AND categoria = ?'
    params.push(categoria)
  }

  if (proveedor) {
    sql += ' AND proveedor = ?'
    params.push(proveedor)
  }

  sql += ' ORDER BY id ASC'

  const filas = db.prepare(sql).all(...params)
  return res.json(filas.map(mapearProducto))
})

/**
 * POST /api/productos
 * Registra un nuevo producto en el inventario usando sentencias preparadas
 */
router.post('/', async (req, res) => {
  const nombre = sanitizarTexto(req.body?.nombre, 120)
  const presentacion = sanitizarTexto(req.body?.presentacion, 80)
  const categoria = sanitizarTexto(req.body?.categoria, 80)
  const proveedor = sanitizarTexto(req.body?.proveedor, 80)
  const codigo = sanitizarTexto(req.body?.codigo || `NS${Date.now()}`, 40)
  const vence = sanitizarTexto(req.body?.vence, 10)
  const precio = Number(req.body?.precio)
  const stock = Number(req.body?.stock)
  const stockMinimo = Number(req.body?.stockMinimo)

  if (
    !nombre ||
    !presentacion ||
    !categoria ||
    !proveedor ||
    !/^\d{4}-\d{2}$/.test(vence) ||
    !Number.isFinite(precio) ||
    precio < 0 ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    !Number.isInteger(stockMinimo) ||
    stockMinimo < 0
  ) {
    return res.status(400).json({ error: 'Datos de producto inválidos o incompletos.' })
  }

  try {
    const info = db
      .prepare(`
        INSERT INTO productos (codigo, nombre, presentacion, categoria, proveedor, precio, stock, stock_minimo, vence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(codigo, nombre, presentacion, categoria, proveedor, precio, stock, stockMinimo, vence)

    const creado = db
      .prepare('SELECT id, codigo, nombre, presentacion, categoria, proveedor, precio, stock, stock_minimo, vence FROM productos WHERE id = ?')
      .get(info.lastInsertRowid)

    await respaldarEnSupabase('productos', 'POST', {
      id: creado.id,
      codigo: creado.codigo,
      nombre: creado.nombre,
      presentacion: creado.presentacion,
      categoria: creado.categoria,
      proveedor: creado.proveedor,
      precio: creado.precio,
      stock: creado.stock,
      stock_minimo: creado.stock_minimo,
      vence: creado.vence,
      activo: true,
    })

    return res.status(201).json(mapearProducto(creado))
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ya existe un producto con ese código.' })
    }
    return res.status(500).json({ error: 'No se pudo registrar el producto.' })
  }
})

/**
 * PUT /api/productos/:id
 * Actualiza un producto existente en el inventario
 */
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de producto inválido.' })
  }

  const nombre = sanitizarTexto(req.body?.nombre, 120)
  const presentacion = sanitizarTexto(req.body?.presentacion, 80)
  const categoria = sanitizarTexto(req.body?.categoria, 80)
  const proveedor = sanitizarTexto(req.body?.proveedor, 80)
  const vence = sanitizarTexto(req.body?.vence, 10)
  const precio = Number(req.body?.precio)
  const stock = Number(req.body?.stock)
  const stockMinimo = Number(req.body?.stockMinimo)

  if (
    !nombre ||
    !presentacion ||
    !categoria ||
    !proveedor ||
    !/^\d{4}-\d{2}$/.test(vence) ||
    !Number.isFinite(precio) ||
    precio < 0 ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    !Number.isInteger(stockMinimo) ||
    stockMinimo < 0
  ) {
    return res.status(400).json({ error: 'Datos de producto inválidos o incompletos.' })
  }

  const existente = db.prepare('SELECT id FROM productos WHERE id = ? AND activo = 1').get(id)
  if (!existente) {
    return res.status(404).json({ error: 'Producto no encontrado.' })
  }

  db.prepare(`
    UPDATE productos
    SET nombre = ?, presentacion = ?, categoria = ?, proveedor = ?, precio = ?, stock = ?, stock_minimo = ?, vence = ?, actualizado_en = datetime('now', 'localtime')
    WHERE id = ?
  `).run(nombre, presentacion, categoria, proveedor, precio, stock, stockMinimo, vence, id)

  const actualizado = db
    .prepare('SELECT id, codigo, nombre, presentacion, categoria, proveedor, precio, stock, stock_minimo, vence FROM productos WHERE id = ?')
    .get(id)

  await respaldarEnSupabase(
    'productos',
    'PATCH',
    {
      nombre,
      presentacion,
      categoria,
      proveedor,
      precio,
      stock,
      stock_minimo: stockMinimo,
      vence,
    },
    `id=eq.${id}`
  )

  return res.json(mapearProducto(actualizado))
})

/**
 * DELETE /api/productos/:id
 * Realiza baja lógica del producto para conservar integridad en el historial de ventas
 */
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de producto inválido.' })
  }

  const resultado = db
    .prepare("UPDATE productos SET activo = 0, actualizado_en = datetime('now', 'localtime') WHERE id = ? AND activo = 1")
    .run(id)

  if (resultado.changes === 0) {
    return res.status(404).json({ error: 'Producto no encontrado.' })
  }

  await respaldarEnSupabase('productos', 'PATCH', { activo: false }, `id=eq.${id}`)

  return res.json({ ok: true, id })
})

export default router
