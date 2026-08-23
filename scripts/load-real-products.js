// Script para cargar los 337 productos reales (con imágenes) a Supabase
// Uso: node scripts/load-real-products.js

const fs = require('fs')
const path = require('path')
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

// Categorías con ajuste de precio habilitado (igual que en setup.sql original)
const CATEGORIAS_CON_AJUSTE = new Set(['Aceites'])

async function main() {
  const jsonPath = path.join('C:', 'Users', 'Usuario', 'Desktop', 'Neo', 'extract', 'products_export.json')
  console.log('Leyendo', jsonPath)
  const raw = fs.readFileSync(jsonPath, 'utf8')
  const productos = JSON.parse(raw)
  console.log('Total productos a cargar:', productos.length)

  // 1) Limpiar datos existentes (orden importa por foreign keys)
  console.log('Borrando order_items...')
  await supabase.from('order_items').delete().not('id', 'is', null)
  console.log('Borrando orders...')
  await supabase.from('orders').delete().not('id', 'is', null)
  console.log('Borrando products...')
  const { error: delErr } = await supabase.from('products').delete().not('id', 'is', null)
  if (delErr) {
    console.error('Error borrando products:', delErr)
    process.exit(1)
  }

  // 2) Insertar en lotes de 10 (los base64 son pesados)
  const BATCH_SIZE = 10
  let insertados = 0
  for (let i = 0; i < productos.length; i += BATCH_SIZE) {
    const lote = productos.slice(i, i + BATCH_SIZE).map(p => ({
      nombre: p.nombre,
      descripcion: p.descripcion,
      categoria: p.categoria,
      precio_unitario: p.precio_unitario,
      precio_bulto: p.precio_bulto,
      factor_bulto: p.factor_bulto,
      precio_min: CATEGORIAS_CON_AJUSTE.has(p.categoria) ? Math.round(p.precio_unitario * 0.9) : null,
      precio_max: CATEGORIAS_CON_AJUSTE.has(p.categoria) ? Math.round(p.precio_unitario * 1.1) : null,
      stock: 100,
      imagen_base64: p.imagen_base64.replace(/^data:image\/png;base64,/, ''),
      permite_ajuste_precio: CATEGORIAS_CON_AJUSTE.has(p.categoria),
    }))

    const { error } = await supabase.from('products').insert(lote)
    if (error) {
      console.error(`Error en lote ${i}-${i + BATCH_SIZE}:`, error.message)
      process.exit(1)
    }
    insertados += lote.length
    console.log(`Progreso: ${insertados}/${productos.length}`)
  }

  console.log('✅ Listo! Todos los productos fueron cargados con imágenes.')
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
