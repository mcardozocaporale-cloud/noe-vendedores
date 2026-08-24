import * as XLSX from 'xlsx'
import { SupabaseClient } from '@supabase/supabase-js'

// Mapeo de "Subrubro" del excel -> categoria que usamos en el catálogo online.
// Si un subrubro nuevo no está acá, se usa tal cual viene del Excel.
const SUBRUBRO_A_CATEGORIA: Record<string, string> = {
  aceite: 'Aceites',
  harina: 'Harinas',
  fideo: 'Fideos',
  arroz: 'Arroces',
  salsa: 'Salsas',
  aderezo: 'Aderezos',
  lacteo: 'Lácteos',
  galletita: 'Galletitas',
  yerba: 'Yerba e Infusiones',
}

export interface FilaExcel {
  codigo: string | null
  nombre: string
  categoria: string
  subrubro: string
  existencia_bulto: number
  pack: number
  costo_unitario: number
  precio_unitario: number
  precio_bulto: number
  precio_especial: number
  activo: boolean
  permite_ajuste_precio: boolean
}

export interface ResumenSync {
  categoria: string
  actualizados: number
  insertados: number
  ocultados: number
  nuevosSinImagen: string[]
  errores: string[]
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

function normalizeHeader(s: any): string {
  return normalizeName(String(s ?? ''))
}

/** Parsea el buffer del .xlsx a filas tipadas, buscando la fila de encabezados (codigo/producto). */
export function parseExcelBuffer(buffer: ArrayBuffer): FilaExcel[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  let headerRowIdx = -1
  let headers: string[] = []
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const normRow = (rows[i] || []).map(normalizeHeader)
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
  const cCategoria = col('categoria')
  const cSubrubro = col('subrubro')
  const cExistencia = col('exisistencia (bulto)', 'existencia (bulto)', 'existencia')
  const cPack = col('pack')
  const cCosto = col('costo unitario')
  const cPu = col('precio unitario')
  const cPb = col('precio bulto')
  const cPe = col('precio especial')
  const cActivo = col('activo')
  const cEspecial = col('especial')

  const num = (v: any) => (v === null || v === undefined || v === '' ? 0 : Number(v) || 0)

  const filas: FilaExcel[] = []
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const nombre = cProducto !== -1 ? row[cProducto] : null
    if (!nombre) continue

    const especialVal = normalizeName(cEspecial !== -1 ? String(row[cEspecial] ?? '') : '')

    filas.push({
      codigo: cCodigo !== -1 && row[cCodigo] != null ? String(row[cCodigo]) : null,
      nombre: String(nombre).trim(),
      categoria: cCategoria !== -1 ? String(row[cCategoria] ?? '').trim() : '',
      subrubro: cSubrubro !== -1 ? String(row[cSubrubro] ?? '').trim() : '',
      existencia_bulto: num(cExistencia !== -1 ? row[cExistencia] : 0),
      pack: num(cPack !== -1 ? row[cPack] : 1) || 1,
      costo_unitario: num(cCosto !== -1 ? row[cCosto] : 0),
      precio_unitario: num(cPu !== -1 ? row[cPu] : 0),
      precio_bulto: num(cPb !== -1 ? row[cPb] : 0),
      precio_especial: num(cPe !== -1 ? row[cPe] : 0),
      activo: Boolean(cActivo !== -1 ? row[cActivo] : true),
      permite_ajuste_precio: especialVal === 'si',
    })
  }

  return filas
}

/** Aplica la sincronización a Supabase, igual que scripts/sync-catalog.js pero server-side. */
export async function sincronizarCatalogo(
  supabase: SupabaseClient,
  filas: FilaExcel[],
  categoriaOverride?: string
): Promise<ResumenSync> {
  if (filas.length === 0) {
    throw new Error('El Excel no tiene productos para procesar.')
  }

  const subrubroKey = normalizeName(filas[0].subrubro || '')
  const categoria = categoriaOverride || SUBRUBRO_A_CATEGORIA[subrubroKey] || filas[0].subrubro || filas[0].categoria

  const { data: existentes, error: fetchErr } = await supabase
    .from('products')
    .select('id, nombre, codigo, imagen_base64')
    .eq('categoria', categoria)

  if (fetchErr) {
    throw new Error('Error trayendo productos existentes: ' + fetchErr.message)
  }

  const existentesPorNombre = new Map<string, { id: string; nombre: string }>()
  for (const p of existentes || []) {
    existentesPorNombre.set(normalizeName(p.nombre), p)
  }

  const matcheados = new Set<string>()
  const resumen: ResumenSync = {
    categoria,
    actualizados: 0,
    insertados: 0,
    ocultados: 0,
    nuevosSinImagen: [],
    errores: [],
  }

  for (const fila of filas) {
    const key = normalizeName(fila.nombre)
    const existente = existentesPorNombre.get(key)

    const payload = {
      nombre: fila.nombre,
      categoria,
      codigo: fila.codigo,
      precio_unitario: fila.precio_unitario,
      precio_bulto: fila.precio_bulto,
      factor_bulto: fila.pack,
      stock: Math.floor((fila.existencia_bulto || 0) * (fila.pack || 1)),
      permite_ajuste_precio: fila.permite_ajuste_precio,
      precio_min: fila.permite_ajuste_precio ? fila.precio_especial : null,
      precio_max: fila.permite_ajuste_precio ? fila.precio_bulto : null,
    }

    if (existente) {
      matcheados.add(existente.id)
      const { error } = await supabase.from('products').update(payload).eq('id', existente.id)
      if (error) {
        resumen.errores.push(`${fila.nombre}: ${error.message}`)
      } else {
        resumen.actualizados++
      }
    } else {
      const { error } = await supabase.from('products').insert({
        ...payload,
        descripcion: fila.nombre,
        imagen_base64: null,
      })
      if (error) {
        resumen.errores.push(`${fila.nombre}: ${error.message}`)
      } else {
        resumen.insertados++
        resumen.nuevosSinImagen.push(fila.nombre)
      }
    }
  }

  const noEnExcel = (existentes || []).filter(p => !matcheados.has(p.id))
  for (const p of noEnExcel) {
    const { error } = await supabase.from('products').update({ stock: 0 }).eq('id', p.id)
    if (!error) resumen.ocultados++
  }

  return resumen
}
