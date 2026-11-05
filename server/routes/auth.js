import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import {
  generarToken,
  limitarIntentosLogin,
  limpiarFallosLogin,
  registrarFalloLogin,
  sanitizarTexto,
  verificarToken,
} from '../middleware/auth.js'

const router = Router()

/**
 * POST /api/auth/login
 * Autentica al usuario mediante consulta parametrizada (prevención de Inyección SQL)
 * y verificación de hash con bcrypt.
 */
router.post('/login', limitarIntentosLogin, (req, res) => {
  const username = sanitizarTexto(req.body?.username, 50).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!username || !password) {
    return res.status(400).json({ error: 'Ingresa tu usuario y contraseña.' })
  }

  // Consulta parametrizada con '?' — inmune a inyección SQL
  const stmt = db.prepare(`
    SELECT id, username, nombre, rol, iniciales, password_hash, activo
    FROM usuarios
    WHERE LOWER(username) = ?
    LIMIT 1
  `)
  const usuario = stmt.get(username)

  if (!usuario || !usuario.activo || !bcrypt.compareSync(password, usuario.password_hash)) {
    registrarFalloLogin(req)
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
  }

  limpiarFallosLogin(req)

  const datosUsuario = {
    id: usuario.id,
    username: usuario.username,
    nombre: usuario.nombre,
    rol: usuario.rol,
    iniciales: usuario.iniciales,
  }

  const token = generarToken(datosUsuario)

  return res.json({
    token,
    usuario: datosUsuario,
  })
})

/**
 * GET /api/auth/me
 * Verifica la sesión actual del usuario autenticado
 */
router.get('/me', verificarToken, (req, res) => {
  return res.json({ usuario: req.usuario })
})

export default router
