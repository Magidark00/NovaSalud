const TOKEN_KEY = 'novasalud_token'
const USER_KEY = 'novasalud_usuario'

export function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function guardarSesionLocal(token, usuario) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(usuario))
}

export function limpiarSesionLocal() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function obtenerUsuarioLocal() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function peticion(ruta, opciones = {}) {
  const token = obtenerToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opciones.headers,
  }

  const respuesta = await fetch(ruta, {
    ...opciones,
    headers,
  })

  const datos = await respuesta.json().catch(() => ({}))

  if (!respuesta.ok) {
    if (respuesta.status === 401 && ruta !== '/api/auth/login') {
      limpiarSesionLocal()
      window.dispatchEvent(new Event('novasalud:unauthorized'))
    }
    throw new Error(datos.error || 'Error en la comunicación con el servidor.')
  }

  return datos
}

// --- Autenticación ---
export function apiLogin(username, password) {
  return peticion('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function apiVerificarSesion() {
  return peticion('/api/auth/me')
}

// --- Dashboard ---
export function apiObtenerDashboard() {
  return peticion('/api/dashboard')
}

// --- Inventario (Productos) ---
export function apiObtenerProductos() {
  return peticion('/api/productos')
}

export function apiCrearProducto(producto) {
  return peticion('/api/productos', {
    method: 'POST',
    body: JSON.stringify(producto),
  })
}

export function apiActualizarProducto(id, producto) {
  return peticion(`/api/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(producto),
  })
}

export function apiEliminarProducto(id) {
  return peticion(`/api/productos/${id}`, {
    method: 'DELETE',
  })
}

// --- Ventas ---
export function apiObtenerVentas() {
  return peticion('/api/ventas')
}

export function apiRegistrarVenta(datosVenta) {
  return peticion('/api/ventas', {
    method: 'POST',
    body: JSON.stringify(datosVenta),
  })
}

// --- Clientes ---
export function apiObtenerClientes() {
  return peticion('/api/clientes')
}

export function apiCrearCliente(cliente) {
  return peticion('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(cliente),
  })
}

export function apiActualizarCliente(id, cliente) {
  return peticion(`/api/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cliente),
  })
}

export function apiEliminarCliente(id) {
  return peticion(`/api/clientes/${id}`, {
    method: 'DELETE',
  })
}

// --- Reposición ---
export function apiObtenerReposicion() {
  return peticion('/api/reposicion')
}

export function apiCrearOrdenReposicion(grupos) {
  return peticion('/api/reposicion', {
    method: 'POST',
    body: JSON.stringify({ grupos }),
  })
}

export function apiRecibirOrdenReposicion(ordenId) {
  return peticion(`/api/reposicion/${ordenId}/recibir`, {
    method: 'PUT',
  })
}
