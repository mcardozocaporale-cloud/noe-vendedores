// Sincroniza el catálogo de Supabase con un JSON exportado desde un Excel de precios/stock
// Uso: node scripts/sync-catalog.js scripts/aceites_export.json "Aceites"
//
// Lógica:
// - Si el producto ya existe (matcheado por nombre normalizado dentro de la categoría), lo ACTUALIZA
//   (precio, stock, ajuste de precio, codigo) y CONSERVA su imagen existente.
// - Si es un producto nuevo (no existía), lo INSERTA sin imagen (hay que cargarla después).
// - Los productos que estaban en esa categoría pero YA NO figuran en el Excel se OCULTAN (stock = 0),
//   no se borran (por si hay que revertir).

const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const { loadEnvLocal } = require('./_env')

const env = loadEnvLocal()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Mapeo de "Subrubro" del excel -> categoria que usamos en el catálogo online
const SUBRUBRO_A_CATEGORIA = {
  'aceite': 'Aceites',
  'harina': 'Harinas',
  'fideo': 'Fideos',
  'arroz': 'Arroces',
  'salsa': 'Salsas',
  'aderezo': 'Aderezos',
  'lacteo': 'Lácteos',
  'galletita': 'Galletitas',
  'yerba': 'Yerba e Infusiones',
}

function normalizeName(s) {
  return (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // sin acentos
    .replace(/[.,]/g, '') // sin puntos/comas (1.5lt == 1,5lt)
    .replace(/\s+/g, ' ')
}

async function main() {
  const jsonPath = process.argv[2]
  const categoriaOverride = process.argv[3] // opcional

  if (!jsonPath) {
    console.error('Uso: node scripts/sync-catalog.js <archivo.json> [categoria]')
    process.exit(1)
  }

  const productosExcel = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  console.log(`Leyendo ${productosExcel.length} productos del Excel...`)

  // Determinar categoría destino (se usa la del primer producto o el override)
  const subrubroKey = normalizeName(productosExcel[0]?.subrubro || '')
  const categoria = categoriaOverride || SUBRUBRO_A_CATEGORIA[subrubroKey] || productosExcel[0]?.subrubro

  console.log(`Categoría destino: "${categoria}"`)

  // Traer productos actuales de esa categoría
  const { data: existentes, error: fetchErr } = await supabase
    .from('products')
    .select('id, nombre, codigo, imagen_base64')
    .eq('categoria', categoria)

  if (fetchErr) {
    console.error('Error trayendo productos existentes:', fetchErr)
    process.exit(1)
  }

  console.log(`Productos actuales en "${categoria}": ${existentes.length}`)

  const existentesPorNombre = new Map()
  for (const p of existentes) {
    existentesPorNombre.set(normalizeName(p.nombre), p)
  }

  const matcheados = new Set() // ids de productos existentes que matchearon con el excel
  let actualizados = 0
  let insertados = 0
  const nuevosSinImagen = []

  for (const p of productosExcel) {
    const key = normalizeName(p.nombre)
    const existente = existentesPorNombre.get(key)

    const payload = {
      nombre: p.nombre,
      categoria: categoria,
      codigo: p.codigo,
      precio_unitario: p.precio_unitario,
      precio_bulto: p.precio_bulto,
      factor_bulto: p.pack,
      stock: Math.floor((p.existencia_bulto || 0) * (p.pack || 1)),
      permite_ajuste_precio: p.permite_ajuste_precio,
      precio_min: p.permite_ajuste_precio ? p.precio_especial : null,
      precio_max: p.permite_ajuste_precio ? p.precio_bulto : null,
    }

    if (existente) {
      matcheados.add(existente.id)
      const { error } = await supabase.from('products').update(payload).eq('id', existente.id)
      if (error) {
        console.error(`Error actualizando "${p.nombre}":`, error.message)
      } else {
        actualizados++
        console.log(`✓ Actualizado: ${p.nombre} (codigo ${p.codigo})`)
      }
    } else {
      const { error } = await supabase.from('products').insert({
        ...payload,
        descripcion: p.nombre,
        imagen_base64: null,
      })
      if (error) {
        console.error(`Error insertando "${p.nombre}":`, error.message)
      } else {
        insertados++
        nuevosSinImagen.push(p.nombre)
        console.log(`+ Insertado (SIN IMAGEN): ${p.nombre} (codigo ${p.codigo})`)
      }
    }
  }

  // Ocultar productos que ya no están en el excel
  const noEnExcel = existentes.filter(p => !matcheados.has(p.id))
  let ocultados = 0
  for (const p of noEnExcel) {
    const { error } = await supabase.from('products').update({ stock: 0 }).eq('id', p.id)
    if (!error) {
      ocultados++
      console.log(`- Ocultado (no está en el excel): ${p.nombre}`)
    }
  }

  console.log('\n===== RESUMEN =====')
  console.log(`Actualizados: ${actualizados}`)
  console.log(`Insertados nuevos: ${insertados}`)
  console.log(`Ocultados (stock=0): ${ocultados}`)
  if (nuevosSinImagen.length) {
    console.log(`\n⚠️ Estos productos son NUEVOS y quedaron SIN IMAGEN:`)
    nuevosSinImagen.forEach(n => console.log(`  - ${n}`))
  }
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
