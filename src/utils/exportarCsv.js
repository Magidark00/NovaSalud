export function exportarCsv(nombre, columnas, filas) {
  const escapar = (valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`
  const contenido = [columnas, ...filas].map((fila) => fila.map(escapar).join(';')).join('\r\n')
  const blob = new Blob([`\uFEFF${contenido}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}
