import * as XLSX from 'xlsx'
import { SupabaseClient } from '@supabase/supabase-js'

// Mapeo de "Subrubro" del excel -> categoria que usamos en el catálogo online.
// Si un subrubro nuevo no está acá, se usa tal cual viene del Excel (capitalizado).
const SUBRUBRO_A_CATEGORIA: Record<string, string> = {
  aceite: 'Aceites',
  harina: 'Harinas',
  fideo: 'Fideos',
  arroz: 'Arroces',
  arroces: 'Arroces',
  salsa: 'Salsas',
  aderezo: 'Aderezos',
  aderezos: 'Aderezos',
  lacteo: 'Lácteos',
  galletita: 'Galletitas',
  yerba: 'Yerba e Infusiones',
  conserva: 'Conservas',
  conservas: 'Conservas',
  almacen: 'Almacén',
}

export interface FilaExcel {
  codigo: string | null
  nombre: string
  variedad: string
  categoria: string
  subrubro: string
  existencia: number
  pack: number
  precio: number // "Precio" -> precio unitario
  precio_vol: number // "Precio Vol" -> precio por bulto (banda naranja)
  precio_liq: number // "Precio Liq" -> precio de liquidación (banda lila, solo si especial = SI)
  activo: boolean // "Activo": manda sobre existencia para decidir si se ve o no
  especial: boolean // especial = SI
}

export interface ProductoSinImagen {
  id: string
  nombre: string
}

export interface ResumenCategoria {
  categoria: string
  actualizados: number
  insertados: number
  eliminados: number
  faltaImagen: ProductoSinImagen[]
  errores: string[]
}

export interface ResumenSync {
  categorias: ResumenCategoria[]
}

function normalizeName(s: string): string {
  return (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // sin acentos
    .replace(/[.,]/g, '') // sin puntos/comas
    .replace(/\s+/g, ' ')
}

function tituloCategoria(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** Parsea el buffer del .xlsx a filas tipadas, buscando la fila de encabezados (codigo/producto). */
export function parseExcelBuffer(buffer: ArrayBuffer): FilaExcel[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  let headerRowIdx = -1
  let headers: string[] = []
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const normRow = (rows[i] || []).map((h: any) => normalizeName(String(h ?? '')))
    if (normRow.includes('codigo') && normRow.includes('producto')) {
      headerRowIdx = i
      headers = normRow
      break
    }
  }

  if (headerRowIdx === -1) {
    throw new Error('No se encontró la fila de encabezados (Código/Producto) en el Excel.')
  }

  const col = (...names: string[]) => {
    for (const n of names) {
      const idx = headers.indexOf(n)
      if (idx !== -1) return idx
    }
    return -1
  }

  const cCodigo = col('codigo')
  const cProducto = col('producto')
  const cVariedad = col('variedad')
  const cCategoria = col('categoria')
  const cSubrubro = col('subrubro')
  const cExistencia = col('existencia', 'exisistencia (bulto)', 'existencia (bulto)')
  const cPack = col('pack', 'vol')
  const cPrecio = col('precio', 'precio unitario')
  const cPrecioVol = col('precio vol', 'precio bulto')
  const cPrecioLiq = col('precio liq', 'precio especial', 'precio liquidacion')
  const cActivo = col('activo')
  const cEspecial = col('especial')

  const num = (v: any) => (v === null || v === undefined || v === '' ? 0 : Number(v) || 0)

  const filas: FilaExcel[] = []
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const nombre = cProducto !== -1 ? row[cProducto] : null
    if (!nombre) continue
    const subrubro = cSubrubro !== -1 ? String(row[cSubrubro] ?? '').trim() : ''
    if (!subrubro || subrubro === '0') continue // filas basura sin subrubro válido

    const especialVal = normalizeName(cEspecial !== -1 ? String(row[cEspecial] ?? '') : '')
    const activoVal = cActivo !== -1 ? row[cActivo] : 1

    filas.push({
      codigo: cCodigo !== -1 && row[cCodigo] != null && row[cCodigo] !== 0 ? String(row[cCodigo]) : null,
      nombre: String(nombre).trim(),
      variedad: cVariedad !== -1 && row[cVariedad] ? String(row[cVariedad]).trim() : '',
      categoria: cCategoria !== -1 ? String(row[cCategoria] ?? '').trim() : '',
      subrubro,
      existencia: num(cExistencia !== -1 ? row[cExistencia] : 0),
      pack: num(cPack !== -1 ? row[cPack] : 1) || 1,
      precio: num(cPrecio !== -1 ? row[cPrecio] : 0),
      precio_vol: num(cPrecioVol !== -1 ? row[cPrecioVol] : 0),
      precio_liq: num(cPrecioLiq !== -1 ? row[cPrecioLiq] : 0),
      activo: Number(activoVal) === 1 || activoVal === true,
      especial: especialVal === 'si',
    })
  }

  return filas
}

/**
 * Sincroniza TODAS las categorías/subrubros presentes en el archivo.
 * "Activo" manda: si Activo=0 el producto se desactiva (no se ve en la web) aunque tenga existencia > 0.
 * "existencia" queda solo como dato informativo (columna stock), no decide visibilidad.
 */
export async function sincronizarCatalogo(
  supabase: SupabaseClient,
  filas: FilaExcel[],
  categoriaOverride?: string
): Promise<ResumenSync> {
  if (filas.length === 0) {
    throw new Error('El Excel no tiene productos para procesar.')
  }

  // Agrupar por subrubro (= página = categoría en nuestro catálogo)
  const porSubrubro = new Map<string, FilaExcel[]>()
  for (const fila of filas) {
    const key = normalizeName(fila.subrubro)
    if (!porSubrubro.has(key)) porSubrubro.set(key, [])
    porSubrubro.get(key)!.push(fila)
  }

  // Cada categoría se procesa en paralelo y, dentro de cada una, los cambios se mandan en lotes
  // (upsert/insert/delete con arrays) en vez de una llamada a Supabase por fila — con Excels de
  // cientos de filas, una llamada por fila en secuencia tarda varios minutos y termina superando
  // el límite de tiempo de la función serverless (el import se queda colgado en "Procesando...").
  const categoriasEntries = Array.from(porSubrubro.entries())

  const resumenes = await Promise.all(
    categoriasEntries.map(([subrubroKey, filasCategoria]) =>
      sincronizarCategoria(supabase, subrubroKey, filasCategoria, categoriaOverride, categoriasEntries.length)
    )
  )

  const resultado: ResumenSync = { categorias: resumenes }

  return resultado
}

async function sincronizarCategoria(
  supabase: SupabaseClient,
  subrubroKey: string,
  filasCategoria: FilaExcel[],
  categoriaOverride: string | undefined,
  totalCategorias: number
): Promise<ResumenCategoria> {
  const categoria =
    categoriaOverride && totalCategorias === 1
      ? categoriaOverride
      : SUBRUBRO_A_CATEGORIA[subrubroKey] || tituloCategoria(filasCategoria[0].subrubro)

  const resumen: ResumenCategoria = {
    categoria,
    actualizados: 0,
    insertados: 0,
    eliminados: 0,
    faltaImagen: [],
    errores: [],
  }

  const { data: existentes, error: fetchErr } = await supabase
    .from('products')
    .select('id, nombre, codigo, imagen_base64')
    .eq('categoria', categoria)

  if (fetchErr) {
    resumen.errores.push(`Error trayendo productos existentes: ${fetchErr.message}`)
    return resumen
  }

  // El código es el identificador único real de cada producto (dos filas pueden compartir el
  // mismo nombre —p.ej. distintos sabores de "Cintitas TOSTEX 125g"— y ser productos distintos).
  // Por eso se matchea primero por código; el nombre queda solo como respaldo para filas sin
  // código, y en ese caso se consume una por una (no se pisan entre sí si hay varias con igual
  // nombre).
  const existentesPorCodigo = new Map<string, { id: string; nombre: string; codigo: string | null }>()
  const existentesPorNombre = new Map<string, { id: string; nombre: string; codigo: string | null }[]>()
  for (const p of existentes || []) {
    if (p.codigo) existentesPorCodigo.set(p.codigo, p)
    const key = normalizeName(p.nombre)
    if (!existentesPorNombre.has(key)) existentesPorNombre.set(key, [])
    existentesPorNombre.get(key)!.push(p)
  }

  const matcheados = new Set<string>()
  const filasParaActualizar: Record<string, any>[] = []
  const filasParaInsertar: Record<string, any>[] = []

  // Fase 1: resolver el match de cada fila contra lo existente — todo en memoria, sin llamadas a
  // la base, para poder mandar los cambios agrupados en pocos lotes en vez de uno por fila.
  for (const fila of filasCategoria) {
    let existente = fila.codigo ? existentesPorCodigo.get(fila.codigo) : undefined
    if (!existente) {
      const candidatos = existentesPorNombre.get(normalizeName(fila.nombre))
      // Solo se usa el respaldo por nombre si ese candidato todavía no fue tomado por otra fila
      // con código (evita que una fila con código robe la fila de otra sin código y viceversa).
      while (candidatos && candidatos.length > 0) {
        const candidato = candidatos.shift()!
        if (!matcheados.has(candidato.id)) {
          existente = candidato
          break
        }
      }
    }

    // En cuanto una fila existente queda "tomada" se la saca de los dos índices — si no, su
    // código VIEJO seguiría apuntándola en existentesPorCodigo (el Map se armó una sola vez al
    // principio y no se actualiza solo) y una fila posterior con ese mismo código viejo la
    // volvería a matchear por error, pisando el UPDATE recién resuelto.
    if (existente) {
      matcheados.add(existente.id)
      if (existente.codigo) existentesPorCodigo.delete(existente.codigo)
      const restantes = existentesPorNombre.get(normalizeName(existente.nombre))
      if (restantes) {
        const idx = restantes.findIndex(c => c.id === existente!.id)
        if (idx !== -1) restantes.splice(idx, 1)
      }
    }

    const payload = {
      nombre: fila.nombre,
      categoria,
      codigo: fila.codigo,
      descripcion: fila.variedad || fila.nombre,
      precio_unitario: fila.precio,
      precio_bulto: fila.precio_vol,
      factor_bulto: fila.pack,
      stock: Math.floor((fila.existencia || 0) * (fila.pack || 1)), // informativo, no decide visibilidad
      activo: fila.activo,
      // "especial" solo define qué banda se imprime en el folder (naranja=Precio Vol vs
      // lila=Precio Liq). El piso de negociación en la web es Precio Liq para TODOS los
      // productos, negocien o no "especial" — por eso precio_min se guarda siempre.
      permite_ajuste_precio: fila.especial,
      precio_min: fila.precio_liq > 0 ? fila.precio_liq : null,
    }

    if (existente) {
      filasParaActualizar.push({ id: existente.id, ...payload })
    } else {
      filasParaInsertar.push({ ...payload, imagen_base64: null })
    }
  }

  // Fase 2: mandar los cambios en lotes. Si un lote entero falla (p.ej. un valor inválido en una
  // sola fila), se reintenta fila por fila solo en ese caso, para no perder el resto del lote ni
  // el detalle de qué fila específica falló.
  if (filasParaActualizar.length > 0) {
    const { error } = await supabase.from('products').upsert(filasParaActualizar)
    if (!error) {
      resumen.actualizados += filasParaActualizar.length
    } else {
      for (const row of filasParaActualizar) {
        const { id, ...payload } = row
        const { error: e2 } = await supabase.from('products').update(payload).eq('id', id)
        if (e2) resumen.errores.push(`${row.nombre}: ${e2.message}`)
        else resumen.actualizados++
      }
    }
  }

  if (filasParaInsertar.length > 0) {
    const { error } = await supabase.from('products').insert(filasParaInsertar)
    if (!error) {
      resumen.insertados += filasParaInsertar.length
    } else {
      for (const row of filasParaInsertar) {
        const { error: e2 } = await supabase.from('products').insert(row)
        if (e2) resumen.errores.push(`${row.nombre}: ${e2.message}`)
        else resumen.insertados++
      }
    }
  }

  // Productos que existían en esta categoría pero ya no figuran en el Excel: el Excel es la única
  // fuente de verdad, no se acumulan versiones viejas -> se borran directamente.
  // Excepción: si el producto ya tiene pedidos reales asociados, no se puede borrar (por integridad
  // de datos históricos) y se lo desactiva en su lugar.
  const noEnExcel = (existentes || []).filter(p => !matcheados.has(p.id))
  if (noEnExcel.length > 0) {
    const idsBorrar = noEnExcel.map(p => p.id)
    const { error: delError } = await supabase.from('products').delete().in('id', idsBorrar)
    if (!delError) {
      resumen.eliminados += idsBorrar.length
    } else {
      // No se pudo borrar el lote entero (probablemente alguno tiene pedidos asociados) ->
      // se reintenta uno por uno, desactivando como respaldo el que no se pueda borrar.
      for (const id of idsBorrar) {
        const { error: e2 } = await supabase.from('products').delete().eq('id', id)
        if (e2) await supabase.from('products').update({ activo: false }).eq('id', id)
        resumen.eliminados++
      }
    }
  }

  // Productos activos de esta categoría que todavía no tienen foto (nuevos o de antes) — se listan
  // acá con su id para poder subirles la imagen directamente desde la pantalla de importación.
  const { data: faltantes } = await supabase
    .from('products')
    .select('id, nombre')
    .eq('categoria', categoria)
    .eq('activo', true)
    .is('imagen_base64', null)
  resumen.faltaImagen = faltantes || []

  return resumen
}
