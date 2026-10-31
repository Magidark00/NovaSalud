// Datos de ejemplo del dashboard.
export const RESUMEN = {
  ventasHoy: 2845.5,
  variacion: 8,
  stockBajo: 18,
  porVencer: 12,
  agotados: 5,
}

export const VENTAS_SEMANA = [
  { dia: 'Lun', ventas: 180 },
  { dia: 'Mar', ventas: 300 },
  { dia: 'Mié', ventas: 420 },
  { dia: 'Jue', ventas: 310 },
  { dia: 'Vie', ventas: 510 },
  { dia: 'Sáb', ventas: 690 },
  { dia: 'Dom', ventas: 570 },
]

// estado: 'bajo' | 'agotado' | 'porVencer'
export const ALERTAS_REPOSICION = [
  { id: 1, producto: 'Amoxicilina 500 mg', detalle: 'Quedan 14', estado: 'bajo' },
  { id: 2, producto: 'Suero oral', detalle: 'Quedan 0', estado: 'agotado' },
  { id: 3, producto: 'Losartán 50 mg', detalle: 'Vence 01/2027', estado: 'porVencer' },
  { id: 4, producto: 'Loratadina 10 mg', detalle: 'Quedan 12', estado: 'bajo' },
]

export const ULTIMAS_VENTAS = [
  { codigo: 'B001-000458', total: 18.5, pago: 'Efectivo' },
  { codigo: 'B001-000459', total: 42.0, pago: 'Yape' },
  { codigo: 'B001-000460', total: 9.0, pago: 'Tarjeta' },
]