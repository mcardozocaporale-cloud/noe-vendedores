// Redimensiona/comprime una foto en el navegador antes de mandarla, para no guardar
// fotos de celular de varios MB como base64 en la base.
export function comprimirImagen(file: File, maxLado = 900, calidad = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxLado || height > maxLado) {
          if (width > height) {
            height = Math.round((height * maxLado) / width)
            width = maxLado
          } else {
            width = Math.round((width * maxLado) / height)
            height = maxLado
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('No se pudo procesar la imagen.'))
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', calidad)
        resolve(dataUrl.replace(/^data:image\/\w+;base64,/, ''))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
