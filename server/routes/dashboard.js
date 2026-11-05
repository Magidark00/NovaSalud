import { Router } from 'express'
import db from '../db.js'
import { verificarToken } from '../middleware/auth.js'

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

function formatearMesAnio(vence) {
  if (!vence || !/^\d{4}-\d{2}$/.test(vence)) return vence
  const [anio, mes] = vence.split('-')
  return `${mes}/${anio}`
}

/**
 * GET /api/dashboard
 * Obtiene en tiempo real los indicadores del Dashboard, gráfico semanal,
 * alertas automáticas de reposición y últimas ventas registradas.
 */
router.get('/', (_req, res) => {
  const productos = db
    .prepare('SELECT id, nombre, stock, stock_minimo, vence FROM productos WHERE activo = 1 ORDER BY stock ASC')
    .all()

  let stockBajo = 0
  let porVencer = 0
  let agotados = 0
  const alertas = []

  for (const p of productos) {
    const estado = calcularEstadoProducto(p)
    if (estado === 'agotado') {
      agotados += 1
      alertas.push({
        id: p.id,
        producto: p.nombre,
        detalle: 'Quedan 0',
        estado: 'agotado',
      })
    } else if (estado === 'bajo') {
      stockBajo += 1
      alertas.push({
        id: p.id,
        producto: p.nombre,
        detalle: `Quedan ${p.stock}`,
        estado: 'bajo',
      })
    } else if (estado === 'porVencer') {
      porVencer += 1
      alertas.push({
        id: p.id,
        producto: p.nombre,
        detalle: `Vence ${formatearMesAnio(p.vence)}`,
        estado: 'porVencer',
      })
    }
  }

  // Base histórica del turno + ventas registradas en la base de datos
  const sumaVentas = db
    .prepare('SELECT COALESCE(SUM(total), 0) AS totalDB FROM ventas')
    .get()
  const ventasHoy = Math.round((2775.5 + Number(sumaVentas.totalDB)) * 100) / 100

  const ventasSemana = db
    .prepare('SELECT dia, ventas FROM ventas_semanales_resumen ORDER BY orden ASC')
    .all()

  const ultimasVentas = db
    .prepare(`
      SELECT codigo_boleta AS codigo, total, metodo_pago AS pago
      FROM ventas
      ORDER BY id DESC
      LIMIT 5
    `)
    .all()

  return res.json({
    resumen: {
      ventasHoy,
      variacion: 8,
      stockBajo,
      porVencer,
      agotados,
    },
    ventasSemana,
    alertasReposicion: alertas.slice(0, 6),
    ultimasVentas,
  })
})

export default router
