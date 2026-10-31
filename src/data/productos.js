// Datos de ejemplo. Más adelante se reemplazan por llamadas a la API / base de datos.
export const CATEGORIAS = [
  'Todos',
  'Analgésicos',
  'Antibióticos',
  'Vitaminas',
  'Cuidado personal',
  'Genéricos',
]

export const PRODUCTOS = [
  { id: 1, codigo: '7750001000011', nombre: 'Paracetamol 500 mg', presentacion: 'Caja x 100', categoria: 'Analgésicos', precio: 12.5, stock: 85, stockMinimo: 20 },
  { id: 2, codigo: '7750001000028', nombre: 'Amoxicilina 500 mg', presentacion: 'Caja x 20', categoria: 'Antibióticos', precio: 18.0, stock: 14, stockMinimo: 20 },
  { id: 3, codigo: '7750001000035', nombre: 'Loratadina 10 mg', presentacion: 'Caja x 10', categoria: 'Genéricos', precio: 6.5, stock: 12, stockMinimo: 15 },
  { id: 4, codigo: '7750001000042', nombre: 'Ibuprofeno 400 mg', presentacion: 'Caja x 30', categoria: 'Analgésicos', precio: 15.0, stock: 60, stockMinimo: 20 },
  { id: 5, codigo: '7750001000059', nombre: 'Suero oral', presentacion: 'Sobre 27.9 g', categoria: 'Cuidado personal', precio: 3.5, stock: 0, stockMinimo: 10 },
  { id: 6, codigo: '7750001000066', nombre: 'Vitamina C 500 mg', presentacion: 'Frasco x 60', categoria: 'Vitaminas', precio: 24.0, stock: 42, stockMinimo: 15 },
]

export const CLIENTES = ['Cliente general', 'María Torres', 'Carlos Quispe', 'Rosa Huamán']