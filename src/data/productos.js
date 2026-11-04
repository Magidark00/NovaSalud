// Datos de ejemplo. Más adelante se reemplazan por llamadas a la API / base de datos.
// `vence` va como 'AAAA-MM'.

// Chips de categorías de la pantalla Ventas
export const CATEGORIAS = [
  'Todos',
  'Analgésicos',
  'Antibióticos',
  'Vitaminas',
  'Cuidado personal',
  'Genéricos',
]

export const PRODUCTOS = [
  { id: 1, codigo: '7750001000011', nombre: 'Paracetamol 500 mg', presentacion: 'Caja x 100', categoria: 'Analgésicos', proveedor: 'Droguería Perú', precio: 12.5, stock: 85, stockMinimo: 20, vence: '2028-03' },
  { id: 2, codigo: '7750001000028', nombre: 'Amoxicilina 500 mg', presentacion: 'Caja x 20', categoria: 'Antibióticos', proveedor: 'Farmex', precio: 18.0, stock: 14, stockMinimo: 20, vence: '2027-08' },
  { id: 3, codigo: '7750001000035', nombre: 'Loratadina 10 mg', presentacion: 'Caja x 10', categoria: 'Genéricos', proveedor: 'Farmex', precio: 6.5, stock: 12, stockMinimo: 15, vence: '2027-05' },
  { id: 4, codigo: '7750001000042', nombre: 'Ibuprofeno 400 mg', presentacion: 'Caja x 30', categoria: 'Analgésicos', proveedor: 'Droguería Perú', precio: 15.0, stock: 60, stockMinimo: 20, vence: '2028-01' },
  { id: 5, codigo: '7750001000059', nombre: 'Suero oral', presentacion: 'Sobre 27.9 g', categoria: 'Cuidado personal', proveedor: 'MediSur', precio: 3.5, stock: 0, stockMinimo: 10, vence: '2027-11' },
  { id: 6, codigo: '7750001000066', nombre: 'Vitamina C 500 mg', presentacion: 'Frasco x 60', categoria: 'Vitaminas', proveedor: 'Droguería Perú', precio: 24.0, stock: 42, stockMinimo: 15, vence: '2028-06' },
  { id: 7, codigo: '7750001000073', nombre: 'Losartán 50 mg', presentacion: 'Caja x 30', categoria: 'Cardiovascular', proveedor: 'MediSur', precio: 21.0, stock: 60, stockMinimo: 20, vence: '2027-01' },
  { id: 8, codigo: '7750001000080', nombre: 'Omeprazol 20 mg', presentacion: 'Caja x 14', categoria: 'Digestivo', proveedor: 'Droguería Perú', precio: 9.5, stock: 6, stockMinimo: 15, vence: '2027-09' },
]

// Provisional: el compañero de Clientes la reemplaza por data/clientes.js
export const CLIENTES = ['Cliente general', 'María Torres', 'Carlos Quispe', 'Rosa Huamán']
