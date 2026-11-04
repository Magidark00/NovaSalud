// Datos de ejemplo para la pantalla Reposición (alineados con el Figma).
// Los estados usan las mismas claves que common/Badge:
// 'bajo' | 'porVencer' | 'agotado' | 'recibida' | 'pendiente'
// Cuando conectes el inventario real, reemplaza PRODUCTOS_REPONER por los
// productos con stock bajo / agotado / por vencer.

export const FILTROS_REPOSICION = [
  { id: 'todos', texto: 'Todos' },
  { id: 'bajo', texto: 'Stock bajo' },
  { id: 'agotado', texto: 'Agotado' },
  { id: 'porVencer', texto: 'Por vencer' },
]

export const RESUMEN_REPOSICION = {
  stockBajo: 18,
  agotados: 5,
  porVencer: 12,
  pedidosPendientes: 4,
}

export const PRODUCTOS_REPONER = [
  { id: 1, nombre: 'Suero oral', proveedor: 'MediSur', stock: 0, stockMin: 10, sugerido: 30, estado: 'agotado' },
  { id: 2, nombre: 'Amoxicilina 500 mg', proveedor: 'Farmex', stock: 14, stockMin: 20, sugerido: 30, estado: 'bajo' },
  { id: 3, nombre: 'Loratadina 10 mg', proveedor: 'Farmex', stock: 12, stockMin: 15, sugerido: 20, estado: 'bajo' },
  { id: 4, nombre: 'Omeprazol 20 mg', proveedor: 'Droguería Perú', stock: 6, stockMin: 15, sugerido: 25, estado: 'bajo' },
  { id: 5, nombre: 'Losartán 50 mg', proveedor: 'MediSur', stock: 60, stockMin: 20, sugerido: 20, estado: 'porVencer' },
  { id: 6, nombre: 'Diclofenaco 50 mg', proveedor: 'Farmex', stock: 8, stockMin: 20, sugerido: 40, estado: 'bajo' },
  { id: 7, nombre: 'Salbutamol inhalador', proveedor: 'Droguería Perú', stock: 0, stockMin: 5, sugerido: 15, estado: 'agotado' },
  { id: 8, nombre: 'Cetirizina 10 mg', proveedor: 'MediSur', stock: 9, stockMin: 15, sugerido: 30, estado: 'bajo' },
]

export const REPOSICIONES_RECIENTES = [
  { id: 'r1', fecha: '30/10', producto: 'Paracetamol 500 mg', cantidad: 50, estado: 'recibida' },
  { id: 'r2', fecha: '28/10', producto: 'Ibuprofeno 400 mg', cantidad: 40, estado: 'pendiente' },
  { id: 'r3', fecha: '25/10', producto: 'Vitamina C 500 mg', cantidad: 30, estado: 'recibida' },
]
