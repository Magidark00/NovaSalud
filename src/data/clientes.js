// Datos de ejemplo de clientes. Más adelante se reemplazan por llamadas a la API / base de datos.
// `ultimaCompra` y `fecha` van como 'AAAA-MM-DD'.

// Indicadores del mes (cuando exista el backend se calculan desde las ventas)
export const RESUMEN_CLIENTES = {
  nuevosMes: 14,
  variacion: 8,
  comprasMes: 342,
}

// Los cuatro clientes que aparecen en el diseño
const CLIENTES_BASE = [
  {
    id: 1,
    nombre: 'María Torres',
    dni: '45892136',
    telefono: '987 654 321',
    compras: 12,
    ultimaCompra: '2026-10-31',
    totalGastado: 486.5,
    ultimasCompras: [
      { codigo: 'B001-000459', fecha: '2026-10-31', total: 42.0, pago: 'Yape' },
      { codigo: 'B001-000431', fecha: '2026-10-24', total: 65.0, pago: 'Efectivo' },
      { codigo: 'B001-000402', fecha: '2026-10-17', total: 28.5, pago: 'Tarjeta' },
    ],
  },
  {
    id: 2,
    nombre: 'Carlos Quispe',
    dni: '70234518',
    telefono: '956 123 478',
    compras: 8,
    ultimaCompra: '2026-10-29',
    totalGastado: 312.0,
    ultimasCompras: [
      { codigo: 'B001-000457', fecha: '2026-10-29', total: 37.5, pago: 'Efectivo' },
      { codigo: 'B001-000440', fecha: '2026-10-26', total: 82.0, pago: 'Yape' },
      { codigo: 'B001-000398', fecha: '2026-10-15', total: 24.5, pago: 'Efectivo' },
    ],
  },
  {
    id: 3,
    nombre: 'Rosa Huamán',
    dni: '41876529',
    telefono: '944 301 872',
    compras: 21,
    ultimaCompra: '2026-10-28',
    totalGastado: 940.2,
    ultimasCompras: [
      { codigo: 'B001-000452', fecha: '2026-10-28', total: 68.9, pago: 'Plin' },
      { codigo: 'B001-000437', fecha: '2026-10-25', total: 54.0, pago: 'Tarjeta' },
      { codigo: 'B001-000419', fecha: '2026-10-21', total: 96.3, pago: 'Efectivo' },
    ],
  },
  {
    id: 4,
    nombre: 'Luis Ramírez',
    dni: '73015284',
    telefono: '998 745 210',
    compras: 3,
    ultimaCompra: '2026-10-25',
    totalGastado: 87.5,
    ultimasCompras: [
      { codigo: 'B001-000449', fecha: '2026-10-25', total: 30.0, pago: 'Efectivo' },
      { codigo: 'B001-000410', fecha: '2026-10-19', total: 40.0, pago: 'Tarjeta' },
      { codigo: 'B001-000377', fecha: '2026-10-08', total: 17.5, pago: 'Efectivo' },
    ],
  },
]

// ---- Relleno para llegar a los 128 clientes registrados del diseño ----
const NOMBRES = [
  'Ana', 'Jorge', 'Lucía', 'Miguel', 'Elena', 'Pedro', 'Carmen', 'Raúl', 'Sofía', 'Diego',
  'Patricia', 'Andrés', 'Julia', 'Hugo', 'Milagros', 'César', 'Flor', 'Iván', 'Gladys', 'Walter',
]
const APELLIDOS = [
  'Flores', 'Vargas', 'Mendoza', 'Castillo', 'Rojas', 'Chávez', 'Paredes', 'Salazar', 'Cárdenas', 'Valdez',
  'Gutiérrez', 'Ríos', 'Espinoza', 'Cruz', 'Aguilar', 'Soto', 'Medina', 'Ramos', 'Núñez', 'Palomino',
]
const PAGOS = ['Efectivo', 'Yape', 'Tarjeta', 'Plin']
const DIA_MS = 86400000

function sumarDias(fecha, dias) {
  return new Date(new Date(`${fecha}T00:00:00Z`).getTime() + dias * DIA_MS).toISOString().slice(0, 10)
}

function generarCliente(i) {
  const compras = 1 + ((i * 7) % 19)
  const ultimaCompra = sumarDias('2026-10-24', -Math.floor(i * 0.75))
  const totalGastado = compras * (14 + ((i * 11) % 30)) + ((i * 5) % 10) * 0.5
  const cantidad = Math.min(compras, 3)

  return {
    id: i + 5,
    nombre: `${NOMBRES[i % NOMBRES.length]} ${APELLIDOS[(i * 7 + Math.floor(i / NOMBRES.length)) % APELLIDOS.length]}`,
    dni: String(40000000 + ((i * 7919321) % 35000000)),
    telefono: `9${(i * 37) % 10}${(i * 11) % 10} ${String(100 + ((i * 53) % 900))} ${String(100 + ((i * 97) % 900))}`,
    compras,
    ultimaCompra,
    totalGastado,
    ultimasCompras: Array.from({ length: cantidad }, (_, k) => ({
      codigo: `B001-${String(Math.max(1, 458 - i * 3 - k * 14)).padStart(6, '0')}`,
      fecha: sumarDias(ultimaCompra, -k * 7),
      total: 10 + ((i * 17 + k * 29) % 80) + ((i + k) % 2) * 0.5,
      pago: PAGOS[(i + k) % PAGOS.length],
    })),
  }
}

// Ordenados por última compra (el más reciente primero)
export const CLIENTES_EJEMPLO = [
  ...CLIENTES_BASE,
  ...Array.from({ length: 124 }, (_, i) => generarCliente(i)),
]
