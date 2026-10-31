const IGV = 0.18

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

// 'agotado' | 'bajo' | 'ok'
export function estadoStock(producto) {
  if (producto.stock === 0) return 'agotado'
  if (producto.stock <= producto.stockMinimo) return 'bajo'
  return 'ok'
}