import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import apiApp from './server/app.js'

function novaSaludBackendPlugin() {
  return {
    name: 'novasalud-express-backend',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          return apiApp(req, res, next)
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), novaSaludBackendPlugin()],
})
