
const IGV = 0.18

// Formatear precios en soles
export function formatSoles(valor) {
  return `S/ ${Number(valor).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Redondear a dos decimales
export function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100
}

// Formatear número de boleta
export function formatBoleta(numero) {
  return `B001-${String(numero).padStart(6, '0')}`
}

// Calcular subtotal, IGV y total
export function calcularTotales(totalBruto, descuento = 0) {
  const total = redondear(Math.max(0, totalBruto - descuento))
  const subtotal = redondear(total / (1 + IGV))
  const igv = redondear(total - subtotal)

  return { subtotal, igv, descuento, total }
}

// Normalizar texto para búsquedas
export function normalizar(texto) {
  return String(texto ?? '').trim().toLowerCase()
}

// Obtener iniciales de un nombre
export function iniciales(nombre) {
  return String(nombre ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join('')
}

// Formatear fecha completa
export function formatFecha(fecha) {
  if (!fecha) return '—'

  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Formatear fecha corta
export function formatFechaCorta(fecha) {
  if (!fecha) return '—'

  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Estado del stock
export function estadoStock(producto) {
  if (producto.stock === 0) return 'agotado'
  if (producto.stock <= producto.stockMinimo) return 'bajo'
  return 'ok'
}

// Estado general del producto
export function estadoProducto(producto) {
  if (producto.stock === 0) return 'agotado'

  if (producto.stock <= producto.stockMinimo) {
    return 'bajo'
  }

  if (producto.vence) {
    const [anio, mes] = producto.vence.split('-').map(Number)

    if (
      Number.isInteger(anio) &&
      Number.isInteger(mes) &&
      mes >= 1 &&
      mes <= 12
    ) {
      const ahora = new Date()
      const mesActual = ahora.getFullYear() * 12 + ahora.getMonth()
      const mesVencimiento = anio * 12 + mes - 1
      const diferencia = mesVencimiento - mesActual

      if (diferencia >= 0 && diferencia <= 3) {
        return 'porVencer'
      }
    }
  }

  return 'normal'
}

// Formatear vencimiento AAAA-MM
export function formatVence(fecha) {
  if (!fecha) return '—'

  const coincidencia = /^(\d{4})-(\d{2})$/.exec(fecha)
  if (!coincidencia) return '—'

  const anio = Number(coincidencia[1])
  const mes = Number(coincidencia[2])

  if (mes < 1 || mes > 12) return '—'

  return new Date(anio, mes - 1, 1).toLocaleDateString('es-PE', {
    month: 'short',
    year: 'numeric',
  })
}
