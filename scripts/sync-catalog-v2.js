// Sincroniza el catálogo con la lógica nueva (Activo manda, Precio/Precio Vol/Precio Liq,
// soporta múltiples subrubros en un mismo archivo). Espejo de lib/excelSync.ts en JS plano.
const fs = require('fs')
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const { loadEnvLocal } = require('./_env')

const env = loadEnvLocal()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const SUBRUBRO_A_CATEGORIA = {
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

function normalizeName(s) {
  return (s || '').toString().trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,]/g, '').replace(/\s+/g, ' ')
}
function tituloCategoria(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function parseExcel(path) {
  const buf = fs.readFileSync(path)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  let headerRowIdx = -1, headers = []
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const normRow = (rows[i] || []).map(h => normalizeName(String(h ?? '')))
    if (normRow.includes('codigo') && normRow.includes('producto')) { headerRowIdx = i; headers = normRow; break }
  }
  if (headerRowIdx === -1) throw new Error('No se encontró fila de encabezados')

  const col = (...names) => { for (const n of names) { const idx = headers.indexOf(n); if (idx !== -1) return idx } return -1 }
  const cCodigo = col('codigo'), cProducto = col('producto'), cVariedad = col('variedad')
  const cCategoria = col('categoria'), cSubrubro = col('subrubro')
  const cExistencia = col('existencia', 'exisistencia (bulto)', 'existencia (bulto)')
  const cPack = col('pack'), cPrecio = col('precio', 'precio unitario')
  const cPrecioVol = col('precio vol', 'precio bulto'), cPrecioLiq = col('precio liq', 'precio especial', 'precio liquidacion')
  const cActivo = col('activo'), cEspecial = col('especial')
  const num = v => (v === null || v === undefined || v === '' ? 0 : Number(v) || 0)

  const filas = []
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const nombre = cProducto !== -1 ? row[cProducto] : null
    if (!nombre) continue
    const subrubro = cSubrubro !== -1 ? String(row[cSubrubro] ?? '').trim() : ''
    if (!subrubro || subrubro === '0') continue
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

async function sincronizar(filas) {
  const porSubrubro = new Map()
  for (const fila of filas) {
    const key = normalizeName(fila.subrubro)
    if (!porSubrubro.has(key)) porSubrubro.set(key, [])
    porSubrubro.get(key).push(fila)
  }

  for (const [subrubroKey, filasCategoria] of porSubrubro) {
    const categoria = SUBRUBRO_A_CATEGORIA[subrubroKey] || tituloCategoria(filasCategoria[0].subrubro)
    console.log(`\n=== ${categoria} (${filasCategoria.length} filas) ===`)

    const { data: existentes, error: fetchErr } = await supabase.from('products').select('id, nombre, codigo, imagen_base64').eq('categoria', categoria)
    if (fetchErr) { console.error('Error trayendo existentes:', fetchErr.message); continue }

    const existentesPorNombre = new Map()
    for (const p of existentes || []) existentesPorNombre.set(normalizeName(p.nombre), p)

    const matcheados = new Set()
    let actualizados = 0, insertados = 0, desactivados = 0
    const nuevosSinImagen = []

    for (const fila of filasCategoria) {
      const key = normalizeName(fila.nombre)
      const existente = existentesPorNombre.get(key)
      const payload = {
        nombre: fila.nombre,
        categoria,
        codigo: fila.codigo,
        descripcion: fila.variedad || fila.nombre,
        precio_unitario: fila.precio,
        precio_bulto: fila.precio_vol,
        factor_bulto: fila.pack,
        stock: Math.floor((fila.existencia || 0) * (fila.pack || 1)),
        activo: fila.activo,
        permite_ajuste_precio: fila.especial,
        precio_min: fila.especial ? fila.precio_liq : null,
        precio_max: fila.especial ? fila.precio_vol : null,
      }
      if (existente) {
        matcheados.add(existente.id)
        const { error } = await supabase.from('products').update(payload).eq('id', existente.id)
        if (error) console.error(`  ERROR ${fila.nombre}: ${error.message}`)
        else { actualizados++; console.log(`  ✓ ${fila.nombre}`) }
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, imagen_base64: null })
        if (error) console.error(`  ERROR ${fila.nombre}: ${error.message}`)
        else { insertados++; if (fila.activo) nuevosSinImagen.push(fila.nombre); console.log(`  + ${fila.nombre} (nuevo${fila.activo ? ', SIN IMAGEN' : ''})`) }
      }
    }

    const noEnExcel = (existentes || []).filter(p => !matcheados.has(p.id))
    for (const p of noEnExcel) {
      const { error } = await supabase.from('products').update({ activo: false }).eq('id', p.id)
      if (!error) { desactivados++; console.log(`  - desactivado: ${p.nombre}`) }
    }

    console.log(`Resumen ${categoria}: actualizados=${actualizados} insertados=${insertados} desactivados=${desactivados}`)
    if (nuevosSinImagen.length) console.log('  Nuevos sin imagen:', nuevosSinImagen.join(', '))
  }
}

const archivo = process.argv[2]
if (!archivo) { console.error('Uso: node sync-catalog-v2.js <archivo.xlsx>'); process.exit(1) }
const filas = parseExcel(archivo)
console.log(`Total filas leídas: ${filas.length}`)
sincronizar(filas).then(() => console.log('\nListo.')).catch(e => { console.error(e); process.exit(1) })
