interface ProductoParaMatch {
  id: string
  nombre: string
  descripcion?: string | null
}

type ConMatch<T> = T & ProductoParaMatch

const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'sin', 'por', 'x'])

function normalizar(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // saca acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 1 && !PALABRAS_VACIAS.has(p))
}

// Matching simple por superposición de palabras significativas — suficiente para el
// volumen del catálogo (cientos de productos), sin necesitar fuzzy search en Postgres.
export function matchearProducto<T>(nombreDetectado: string, productos: ConMatch<T>[]): ConMatch<T> | null {
  const palabrasDetectadas = new Set(normalizar(nombreDetectado))
  if (palabrasDetectadas.size === 0) return null

  let mejor: ConMatch<T> | null = null
  let mejorScore = 0

  for (const producto of productos) {
    const palabrasProducto = new Set(normalizar(`${producto.nombre} ${producto.descripcion || ''}`))
    if (palabrasProducto.size === 0) continue

    let coincidencias = 0
    for (const palabra of palabrasDetectadas) {
      if (palabrasProducto.has(palabra)) coincidencias++
    }
    // Jaccard-like: coincidencias sobre el tamaño del set más chico, para no penalizar
    // nombres de producto más largos que el texto detectado.
    const score = coincidencias / Math.min(palabrasDetectadas.size, palabrasProducto.size)

    if (score > mejorScore) {
      mejorScore = score
      mejor = producto
    }
  }

  return mejorScore >= 0.6 ? mejor : null
}
