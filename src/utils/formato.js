const IGV = 0.18
const DIAS_POR_VENCER = 90

export function formatSoles(valor) {
  return `S/ ${Number(valor).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

export function formatBoleta(numero) {
  return `B001-${String(numero).padStart(6, '0')}`
}

// Los precios del inventario ya incluyen IGV (18%),
// así que el subtotal y el IGV se calculan hacia atrás desde el total.
export function calcularTotales(totalBruto, descuento = 0) {
  const total = redondear(Math.max(0, totalBruto - descuento))
  const subtotal = redondear(total / (1 + IGV))
  const igv = redondear(total - subtotal)
  return { subtotal, igv, descuento, total }
}

// Estado de stock para las tarjetas de Ventas: 'agotado' | 'bajo' | 'ok'
export function estadoStock(producto) {
  if (producto.stock === 0) return 'agotado'
  if (producto.stock <= producto.stockMinimo) return 'bajo'
  return 'ok'
}

// Estado completo para Inventario y Reposición:
// 'agotado' | 'bajo' | 'porVencer' | 'normal'
export function estadoProducto(producto) {
  if (producto.stock === 0) return 'agotado'
  if (producto.stock <= producto.stockMinimo) return 'bajo'
  const [anio, mes] = producto.vence.split('-').map(Number)
  const ultimoDia = new Date(anio, mes, 0) // último día del mes de vencimiento
  const dias = (ultimoDia - new Date()) / 86400000
  if (dias <= DIAS_POR_VENCER) return 'porVencer'
  return 'normal'
}

// Cantidad a pedir, redondeada a múltiplos de 5
export function cantidadSugerida(producto) {
  const objetivo = producto.stock === 0 ? producto.stockMinimo * 3 : producto.stockMinimo * 2
  const faltante = objetivo - producto.stock
  return faltante > 0 ? Math.ceil(faltante / 5) * 5 : 0
}

// '2028-03' -> '03/2028'
export function formatVence(vence) {
  const [anio, mes] = vence.split('-')
  return `${mes}/${anio}`
}

// '2026-10-31' -> '31/10/2026'
export function formatFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

// '2026-10-31' -> '31/10'
export function formatFechaCorta(fecha) {
  const [, mes, dia] = fecha.split('-')
  return `${dia}/${mes}`
}

// Fecha de hoy (hora local) como 'AAAA-MM-DD'
export function fechaHoy() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

// 'María Torres' -> 'MT'
export function iniciales(nombre) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase()
}

// Quita tildes y pasa a minúsculas para buscar sin importar las tildes
export function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
