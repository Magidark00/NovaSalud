import { DatabaseSync } from 'node:sqlite'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { PRODUCTOS } from '../src/data/productos.js'
import { CLIENTES_EJEMPLO } from '../src/data/clientes.js'
import { REPOSICIONES_RECIENTES } from '../src/data/reposicion.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// En entornos serverless (Vercel) se utiliza /tmp que tiene permisos de escritura
const DB_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), 'novasalud.db')
  : path.join(__dirname, 'novasalud.db')

const db = new DatabaseSync(DB_PATH)

// Activar claves foráneas y modo WAL para concurrencia segura
db.exec('PRAGMA foreign_keys = ON;')
db.exec('PRAGMA journal_mode = WAL;')

/**
 * Inicializa todas las tablas del sistema Nova Salud
 * Incluye esquema completo para:
 * - Usuarios y Autenticación (Seguridad / Roles)
 * - Productos (Inventario)
 * - Ventas y Detalle de Ventas (POS y Dashboard)
 * - Clientes (Directorio e historial de compras por cliente)
 * - Órdenes de Reposición y Detalle (Abastecimiento y recepción de stock)
 */
export function inicializarBaseDeDatos() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('Administrador', 'Farmacéutico', 'Cajero', 'Almacenero')),
      iniciales TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      presentacion TEXT NOT NULL,
      categoria TEXT NOT NULL,
      proveedor TEXT NOT NULL,
      precio REAL NOT NULL CHECK(precio >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      stock_minimo INTEGER NOT NULL DEFAULT 10 CHECK(stock_minimo >= 0),
      vence TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      actualizado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dni TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      direccion TEXT,
      compras INTEGER NOT NULL DEFAULT 0,
      ultima_compra TEXT,
      total_gastado REAL NOT NULL DEFAULT 0,
      ultimas_compras_json TEXT NOT NULL DEFAULT '[]',
      creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_boleta INTEGER UNIQUE NOT NULL,
      codigo_boleta TEXT UNIQUE NOT NULL,
      cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
      cliente_nombre TEXT NOT NULL DEFAULT 'Cliente general',
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
      metodo_pago TEXT NOT NULL,
      subtotal REAL NOT NULL,
      igv REAL NOT NULL,
      descuento REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      recibido REAL,
      vuelto REAL DEFAULT 0,
      fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
      producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
      producto_nombre TEXT NOT NULL,
      cantidad INTEGER NOT NULL CHECK(cantidad > 0),
      precio_unitario REAL NOT NULL,
      importe REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ventas_semanales_resumen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dia TEXT UNIQUE NOT NULL,
      orden INTEGER NOT NULL,
      ventas REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ordenes_reposicion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      proveedor TEXT NOT NULL,
      fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'recibida', 'cancelada')),
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
      observaciones TEXT
    );

    CREATE TABLE IF NOT EXISTS detalle_reposicion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orden_id INTEGER NOT NULL REFERENCES ordenes_reposicion(id) ON DELETE CASCADE,
      producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
      producto_nombre TEXT NOT NULL,
      cantidad INTEGER NOT NULL CHECK(cantidad > 0)
    );

    CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
    CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
    CREATE INDEX IF NOT EXISTS idx_clientes_dni ON clientes(dni);
    CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
  `)

  const columnasClientes = db.prepare('PRAGMA table_info(clientes)').all()
  if (!columnasClientes.some((c) => c.name === 'ultimas_compras_json')) {
    db.exec("ALTER TABLE clientes ADD COLUMN ultimas_compras_json TEXT NOT NULL DEFAULT '[]';")
    const updateJson = db.prepare('UPDATE clientes SET ultimas_compras_json = ? WHERE id = ?')
    for (const c of CLIENTES_EJEMPLO) {
      updateJson.run(JSON.stringify(c.ultimasCompras || []), c.id)
    }
  }

  sembrarDatosIniciales()
}

function sembrarDatosIniciales() {
  // 1. Sembrar Usuarios por defecto (contraseñas encriptadas con bcrypt)
  const totalUsuarios = db.prepare('SELECT COUNT(*) AS count FROM usuarios').get().count
  if (totalUsuarios === 0) {
    const insertUsuario = db.prepare(`
      INSERT INTO usuarios (username, nombre, rol, iniciales, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `)
    insertUsuario.run('admin', 'Dra. Valeria Gómez', 'Administrador', 'VG', bcrypt.hashSync('admin123', 10))
    insertUsuario.run('farmaceutico', 'Lic. Lucía Salazar', 'Farmacéutico', 'LS', bcrypt.hashSync('farma123', 10))
    insertUsuario.run('cajero', 'Marco Paredes', 'Cajero', 'MP', bcrypt.hashSync('cajero123', 10))
  }

  // 2. Sembrar Productos del Inventario
  const totalProductos = db.prepare('SELECT COUNT(*) AS count FROM productos').get().count
  if (totalProductos === 0) {
    const insertProducto = db.prepare(`
      INSERT INTO productos (id, codigo, nombre, presentacion, categoria, proveedor, precio, stock, stock_minimo, vence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const p of PRODUCTOS) {
      insertProducto.run(
        p.id,
        p.codigo,
        p.nombre,
        p.presentacion,
        p.categoria,
        p.proveedor,
        p.precio,
        p.stock,
        p.stockMinimo,
        p.vence
      )
    }
  }

  // 3. Sembrar Clientes
  const totalClientes = db.prepare('SELECT COUNT(*) AS count FROM clientes').get().count
  if (totalClientes === 0) {
    const insertCliente = db.prepare(`
      INSERT INTO clientes (id, dni, nombre, telefono, compras, ultima_compra, total_gastado, ultimas_compras_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const c of CLIENTES_EJEMPLO) {
      insertCliente.run(
        c.id,
        c.dni,
        c.nombre,
        c.telefono,
        c.compras,
        c.ultimaCompra,
        c.totalGastado,
        JSON.stringify(c.ultimasCompras || [])
      )
    }
  }

  // 4. Sembrar Ventas iniciales y Resumen Semanal para el Dashboard
  const totalVentas = db.prepare('SELECT COUNT(*) AS count FROM ventas').get().count
  if (totalVentas === 0) {
    const insertVenta = db.prepare(`
      INSERT INTO ventas (numero_boleta, codigo_boleta, cliente_id, cliente_nombre, usuario_id, metodo_pago, subtotal, igv, descuento, total, recibido, vuelto, fecha)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `)
    const insertDetalle = db.prepare(`
      INSERT INTO detalle_ventas (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, importe)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const ventasSemilla = [
      {
        numero: 458,
        codigo: 'B001-000458',
        clienteId: 2,
        clienteNombre: 'Carlos Quispe',
        pago: 'Efectivo',
        total: 18.5,
        items: [
          { productoId: 1, nombre: 'Paracetamol 500 mg', cantidad: 1, precio: 12.5, importe: 12.5 },
          { productoId: 3, nombre: 'Loratadina 10 mg', cantidad: 1, precio: 6.0, importe: 6.0 },
        ],
      },
      {
        numero: 459,
        codigo: 'B001-000459',
        clienteId: 1,
        clienteNombre: 'María Torres',
        pago: 'Yape',
        total: 42.0,
        items: [
          { productoId: 7, nombre: 'Losartán 50 mg', cantidad: 2, precio: 21.0, importe: 42.0 },
        ],
      },
      {
        numero: 460,
        codigo: 'B001-000460',
        clienteId: null,
        clienteNombre: 'Cliente general',
        pago: 'Tarjeta',
        total: 9.5,
        items: [
          { productoId: 8, nombre: 'Omeprazol 20 mg', cantidad: 1, precio: 9.5, importe: 9.5 },
        ],
      },
    ]

    for (const v of ventasSemilla) {
      const subtotal = Math.round((v.total / 1.18) * 100) / 100
      const igv = Math.round((v.total - subtotal) * 100) / 100
      const info = insertVenta.run(
        v.numero,
        v.codigo,
        v.clienteId,
        v.clienteNombre,
        1,
        v.pago,
        subtotal,
        igv,
        0,
        v.total,
        v.total,
        0
      )
      for (const item of v.items) {
        insertDetalle.run(info.lastInsertRowid, item.productoId, item.nombre, item.cantidad, item.precio, item.importe)
      }
    }
  }

  const totalSemana = db.prepare('SELECT COUNT(*) AS count FROM ventas_semanales_resumen').get().count
  if (totalSemana === 0) {
    const insertDia = db.prepare('INSERT INTO ventas_semanales_resumen (dia, orden, ventas) VALUES (?, ?, ?)')
    const dias = [
      ['Lun', 1, 180],
      ['Mar', 2, 300],
      ['Mié', 3, 420],
      ['Jue', 4, 310],
      ['Vie', 5, 510],
      ['Sáb', 6, 690],
      ['Dom', 7, 570],
    ]
    for (const [dia, orden, monto] of dias) {
      insertDia.run(dia, orden, monto)
    }
  }

  // 5. Sembrar Órdenes de Reposición
  const totalReposiciones = db.prepare('SELECT COUNT(*) AS count FROM ordenes_reposicion').get().count
  if (totalReposiciones === 0) {
    const insertOrden = db.prepare(`
      INSERT INTO ordenes_reposicion (codigo, proveedor, fecha, estado, usuario_id)
      VALUES (?, ?, ?, ?, 1)
    `)
    const insertDetalleRepo = db.prepare(`
      INSERT INTO detalle_reposicion (orden_id, producto_id, producto_nombre, cantidad)
      VALUES (?, ?, ?, ?)
    `)
    for (const r of REPOSICIONES_RECIENTES) {
      const prod = PRODUCTOS.find((p) => p.nombre === r.producto)
      const [dia, mes] = r.fecha.split('/')
      const info = insertOrden.run(
        r.id.toUpperCase(),
        prod?.proveedor ?? 'Droguería Perú',
        `2026-${mes}-${dia}`,
        r.estado
      )
      insertDetalleRepo.run(info.lastInsertRowid, prod?.id ?? null, r.producto, r.cantidad)
    }
  }
}

export default db
