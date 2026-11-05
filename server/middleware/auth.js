import jwt from 'jsonwebtoken'
import db from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'novasalud-secret-key-2026-seguridad-botica'
const JWT_EXPIRES_IN = '12h'

// Control de intentos de inicio de sesión contra fuerza bruta
const intentosLogin = new Map()
const MAX_INTENTOS = 6
const BLOQUEO_MS = 2 * 60 * 1000 // 2 minutos

export function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
      iniciales: usuario.iniciales,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * Cabeceras de seguridad HTTP para todas las respuestas
 */
export function cabecerasSeguridad(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
}

/**
 * Limitador de intentos en login para mitigar ataques de fuerza bruta
 */
export function limitarIntentosLogin(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'local'
  const ahora = Date.now()
  const registro = intentosLogin.get(ip)

  if (registro && registro.bloqueadoHasta > ahora) {
    const segundosRestantes = Math.ceil((registro.bloqueadoHasta - ahora) / 1000)
    return res.status(429).json({
      error: `Demasiados intentos fallidos. Intenta nuevamente en ${segundosRestantes} segundos.`,
    })
  }
  next()
}

export function registrarFalloLogin(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'local'
  const ahora = Date.now()
  const actual = intentosLogin.get(ip) || { conteo: 0, bloqueadoHasta: 0 }
  actual.conteo += 1
  if (actual.conteo >= MAX_INTENTOS) {
    actual.bloqueadoHasta = ahora + BLOQUEO_MS
    actual.conteo = 0
  }
  intentosLogin.set(ip, actual)
}

export function limpiarFallosLogin(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'local'
  intentosLogin.delete(ip)
}

/**
 * Middleware que protege rutas privadas verificando el token JWT
 */
export function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado. Token requerido.' })
  }

  const token = authHeader.slice(7).trim()
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    // Consulta parametrizada segura contra inyección SQL
    const usuario = db
      .prepare('SELECT id, username, nombre, rol, iniciales, activo FROM usuarios WHERE id = ?')
      .get(Number(payload.id))

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Sesión inválida o usuario inactivo.' })
    }

    req.usuario = usuario
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado. Inicia sesión nuevamente.' })
  }
}

/**
 * Sanitiza cadenas de texto y previene caracteres de control o payloads maliciosos
 */
export function sanitizarTexto(valor, maxLen = 150) {
  if (typeof valor !== 'string') return ''
  return valor
    .replace(/\p{Cc}/gu, '')
    .trim()
    .slice(0, maxLen)
}
