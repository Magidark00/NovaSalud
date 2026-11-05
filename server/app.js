import express from 'express'
import cors from 'cors'
import { inicializarBaseDeDatos } from './db.js'
import { cabecerasSeguridad } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import productosRoutes from './routes/productos.js'
import ventasRoutes from './routes/ventas.js'
import dashboardRoutes from './routes/dashboard.js'
import clientesRoutes from './routes/clientes.js'
import reposicionRoutes from './routes/reposicion.js'

// Inicializar tablas y semillas en SQLite
inicializarBaseDeDatos()

const app = express()

app.use(cabecerasSeguridad)
app.use(cors())
app.use(express.json({ limit: '100kb' }))

// Rutas de la API REST (Todos los módulos de Nova Salud)
app.use('/api/auth', authRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/ventas', ventasRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/reposicion', reposicionRoutes)

// Endpoint de estado del servidor y base de datos
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    sistema: 'Nova Salud API',
    modulosActivos: ['auth', 'dashboard', 'ventas', 'inventario', 'clientes', 'reposicion'],
    baseDeDatos: 'SQLite (WAL Mode + Prepared Statements)',
  })
})

export default app
