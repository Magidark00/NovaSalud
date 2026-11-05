import db from './db.js'

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''

export const supabaseActivo = Boolean(SUPABASE_URL && SUPABASE_KEY)

function headersSupabase(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export async function supabaseFetch(ruta, opciones = {}) {
  if (!supabaseActivo) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
      ...opciones,
      headers: headersSupabase(opciones.headers),
    })
    if (!res.ok) return null
    const texto = await res.text()
    return texto ? JSON.parse(texto) : null
  } catch {
    return null
  }
}

let sincronizadoInicial = false
let promesaSincronizacion = null

/**
 * Al iniciar el servidor o función Serverless en Vercel, descarga el estado
 * persistido en Supabase (si las variables están configuradas) hacia el motor local.
 */
export function sincronizarDesdeSupabase() {
  if (!supabaseActivo || sincronizadoInicial) return Promise.resolve()
  if (promesaSincronizacion) return promesaSincronizacion

  promesaSincronizacion = (async () => {
    try {
      const [productos, clientes, ventas, detallesVenta, semana, ordenes, detallesRepo] =
        await Promise.all([
          supabaseFetch('productos?select=*&order=id.asc'),
          supabaseFetch('clientes?select=*&order=id.asc'),
          supabaseFetch('ventas?select=*&order=id.asc'),
          supabaseFetch('detalle_ventas?select=*&order=id.asc'),
          supabaseFetch('ventas_semanales_resumen?select=*&order=orden.asc'),
          supabaseFetch('ordenes_reposicion?select=*&order=id.asc'),
          supabaseFetch('detalle_reposicion?select=*&order=id.asc'),
        ])

      db.exec('BEGIN IMMEDIATE TRANSACTION;')

      if (Array.isArray(productos) && productos.length > 0) {
        const upsertProd = db.prepare(`
          INSERT OR REPLACE INTO productos (id, codigo, nombre, presentacion, categoria, proveedor, precio, stock, stock_minimo, vence, activo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        for (const p of productos) {
          upsertProd.run(
            Number(p.id),
            p.codigo,
            p.nombre,
            p.presentacion,
            p.categoria,
            p.proveedor,
            Number(p.precio),
            Number(p.stock),
            Number(p.stock_minimo),
            p.vence,
            p.activo === false ? 0 : 1
          )
        }
      }

      if (Array.isArray(clientes) && clientes.length > 0) {
        const upsertCliente = db.prepare(`
          INSERT OR REPLACE INTO clientes (id, dni, nombre, telefono, compras, ultima_compra, total_gastado, ultimas_compras_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        for (const c of clientes) {
          const jsonCompras =
            typeof c.ultimas_compras_json === 'string'
              ? c.ultimas_compras_json
              : JSON.stringify(c.ultimas_compras_json || [])
          upsertCliente.run(
            Number(c.id),
            c.dni,
            c.nombre,
            c.telefono || '',
            Number(c.compras || 0),
            c.ultima_compra || '',
            Number(c.total_gastado || 0),
            jsonCompras
          )
        }
      }

      if (Array.isArray(ventas) && ventas.length > 0) {
        const upsertVenta = db.prepare(`
          INSERT OR REPLACE INTO ventas (id, numero_boleta, codigo_boleta, cliente_id, cliente_nombre, usuario_id, metodo_pago, subtotal, igv, descuento, total, recibido, vuelto, fecha)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        for (const v of ventas) {
          upsertVenta.run(
            Number(v.id),
            Number(v.numero_boleta),
            v.codigo_boleta,
            v.cliente_id ? Number(v.cliente_id) : null,
            v.cliente_nombre || 'Cliente general',
            v.usuario_id ? Number(v.usuario_id) : 1,
            v.metodo_pago,
            Number(v.subtotal),
            Number(v.igv),
            Number(v.descuento || 0),
            Number(v.total),
            Number(v.recibido || v.total),
            Number(v.vuelto || 0),
            v.fecha || new Date().toISOString()
          )
        }
      }

      if (Array.isArray(detallesVenta) && detallesVenta.length > 0) {
        const upsertDet = db.prepare(`
          INSERT OR REPLACE INTO detalle_ventas (id, venta_id, producto_id, producto_nombre, cantidad, precio_unitario, importe)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        for (const d of detallesVenta) {
          upsertDet.run(
            Number(d.id),
            Number(d.venta_id),
            d.producto_id ? Number(d.producto_id) : null,
            d.producto_nombre,
            Number(d.cantidad),
            Number(d.precio_unitario),
            Number(d.importe)
          )
        }
      }

      if (Array.isArray(semana) && semana.length > 0) {
        const updateSem = db.prepare('UPDATE ventas_semanales_resumen SET ventas = ? WHERE dia = ?')
        for (const s of semana) {
          updateSem.run(Number(s.ventas), s.dia)
        }
      }

      if (Array.isArray(ordenes) && ordenes.length > 0) {
        const upsertOrd = db.prepare(`
          INSERT OR REPLACE INTO ordenes_reposicion (id, codigo, proveedor, fecha, estado, usuario_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        for (const o of ordenes) {
          upsertOrd.run(
            Number(o.id),
            o.codigo,
            o.proveedor,
            o.fecha,
            o.estado,
            o.usuario_id ? Number(o.usuario_id) : 1
          )
        }
      }

      if (Array.isArray(detallesRepo) && detallesRepo.length > 0) {
        const upsertDetRepo = db.prepare(`
          INSERT OR REPLACE INTO detalle_reposicion (id, orden_id, producto_id, producto_nombre, cantidad)
          VALUES (?, ?, ?, ?, ?)
        `)
        for (const dr of detallesRepo) {
          upsertDetRepo.run(
            Number(dr.id),
            Number(dr.orden_id),
            dr.producto_id ? Number(dr.producto_id) : null,
            dr.producto_nombre,
            Number(dr.cantidad)
          )
        }
      }

      db.exec('COMMIT;')
      sincronizadoInicial = true
    } catch {
      try {
        db.exec('ROLLBACK;')
      } catch {
        // Ignorar
      }
    }
  })()

  return promesaSincronizacion
}

/**
 * Sincroniza hacia Supabase los cambios realizados en las tablas principales
 */
export async function respaldarEnSupabase(tabla, metodo, datos, filtroQuery = '') {
  if (!supabaseActivo) return
  const ruta = filtroQuery ? `${tabla}?${filtroQuery}` : tabla
  const headers =
    metodo === 'POST'
      ? { Prefer: 'resolution=merge-duplicates,return=minimal' }
      : { Prefer: 'return=minimal' }

  await supabaseFetch(ruta, {
    method: metodo,
    headers,
    body: datos ? JSON.stringify(datos) : undefined,
  })
}
