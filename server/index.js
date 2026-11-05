import app from './app.js'

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`✅ Servidor Backend Nova Salud ejecutándose en http://localhost:${PORT}`)
})
