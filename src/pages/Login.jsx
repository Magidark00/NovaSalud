import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Plus, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const RECORDAR_USUARIO_KEY = 'novasalud_usuario_recordado'

export default function Login() {
  const { autenticado, iniciarSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const [username, setUsername] = useState(() => localStorage.getItem(RECORDAR_USUARIO_KEY) || '')
  const [password, setPassword] = useState('')
  const [recordar, setRecordar] = useState(() => Boolean(localStorage.getItem(RECORDAR_USUARIO_KEY)))
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (autenticado) {
    const destino = ubicacion.state?.from?.pathname || '/'
    return <Navigate to={destino} replace />
  }

  async function manejarSubmit(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const usuarioLimpio = username.trim()
      await iniciarSesion(usuarioLimpio, password)
      if (recordar) {
        localStorage.setItem(RECORDAR_USUARIO_KEY, usuarioLimpio)
      } else {
        localStorage.removeItem(RECORDAR_USUARIO_KEY)
      }
      const destino = ubicacion.state?.from?.pathname || '/'
      navegar(destino, { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login-screen">
      <aside className="login-screen__brand" aria-label="Nova Salud">
        <div className="login-screen__logo">
          <Plus size={56} strokeWidth={5} aria-hidden="true" />
          <h1>Nova Salud</h1>
        </div>
      </aside>

      <section className="login-screen__panel" aria-label="Iniciar sesión">
        <div className="login-screen__box">
          <div className="login-screen__titles">
            <h2>Iniciar sesión</h2>
            <p>Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          {error && (
            <div className="login-screen__alert" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={manejarSubmit}>
            <label className="login-field">
              <span>Usuario</span>
              <div className="login-field__control">
                <User size={18} aria-hidden="true" />
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  placeholder="Ingresa tu usuario"
                  required
                  autoFocus={!username}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </label>

            <label className="login-field">
              <span>Contraseña</span>
              <div className="login-field__control">
                <Lock size={18} aria-hidden="true" />
                <input
                  type={mostrarClave ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  required
                  autoFocus={Boolean(username)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-field__eye"
                  onClick={() => setMostrarClave((v) => !v)}
                  aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarClave ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="login-remember">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              <span>Recordar mi usuario en este equipo</span>
            </label>

            <button
              type="submit"
              className="btn btn--primary btn--block login-form__submit"
              disabled={enviando}
            >
              {enviando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
