// Copia imagen_base64 de productos viejos (desactivados por renombre) a sus equivalentes nuevos.
const { createClient } = require('@supabase/supabase-js')
const { loadEnvLocal } = require('./_env')
const env = loadEnvLocal()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// [nombre_nuevo, nombre_viejo_con_imagen]
const pares = [
  ['Aceite NATURA girasol 1.5t', 'Aceite NATURA girasol 1.5lt'],
  ['Arroz CAÑUELAS 500g', 'Arroz CAÑUELAS l/f 500g'],
  ['Arroz CAÑUELAS kg', 'Arroz CAÑUELAS l/f kilo'],
  ['Arroz GALLO lf 500g', 'Arroz GALLO l/f 500g'],
  ['Arroz LUCCHETTI lf 500g', 'Arroz LUCCHETTI l/f 500g'],
  ['Arroz LUCCHETTI lf kg', 'Arroz LUCCHETTI l/f kilo'],
  ['Atun BAHIA desm. 170g', 'Atún BAHIA desmenuzado 170g'],
  ['Atun BAHIA lomito 170g', 'Atún BAHIA lomitos 170g'],
  ['Atún CUMANA desm. 170g', 'Atún CUMANA desmenuzado 170g'],
  ['Choclo INALPA 300g', 'Choclo INALPA amarillo 300g'],
  ['Choclo OKEY 280g', 'Choclo OKEY amarillo 280g'],
  ['Paté SWIFT 90g', 'Paté/Picadillo SWIFT 90g'],
  ['Picadillo SWIFT 90g', 'Paté/Picadillo SWIFT 90g'],
  ['Caldo KNORR verdura x12 uni', 'Caldo KNORR verduras x12 cub'],
  ['Caldo KNORR verdura x6 uni', 'Caldo KNORR verduras x6 cub'],
  ['Jugo de limón SILVA 960cc', 'Jugo limón SILVA litro'],
  ['Sal DOS ESTRELLAS fina 500g', 'Sal fina DOS ESTRELLAS 500g'],
  ['Sal gruesa TRESAL kg', 'Sal Gruesa TRESAL kilo'],
  ['Vinagre SILVA 960cc', 'Vinagre SILVA litro'],
  ['Vinagre SILVA bidon 5lt', 'Vinagre SILVA bidón 5 litros'],
  ['Fideos ARCOR ramén 70g', 'Ramén ARCOR 70g'],
  ['Fideos LUCCHETTI 500g cabello angel', 'Fideos LUCCHETTI cabello de ángel 500g'],
  ['Fideos SOL PAMPEANO 3 veg 500g', 'Fideos SOL PAMPEANO 3 vegetales 500g'],
  ['Harina 000 CAÑUELAS kg', 'Harina CAÑUELAS 000 kilo'],
  ['Harina 0000 PUREZA kg', 'Harina PUREZA 0000 kilo'],
  ['Harina leudante BLANCAFLOR kg', 'Harina BLANCAFLOR leudante kilo'],
  ['Harina leudante PUREZA kg', 'Harina PUREZA leudante kilo'],
  ['Harina MORIXE 000 kg', 'Harina MORIXE 000 kilo'],
  ['Harina PUREZA pizza kg', 'Harina PUREZA pizza kilo'],
  ['Ketchup NATURA 250ml', 'Ketchup NATURA 250g'],
  ['Mayonesa CADA DIA 900g', 'Mayonesa CADA DIA kg'],
  ['Mayonesa HELLMANNS clas dp 237g', 'Mayonesa HELLMANNS clásica 237g'],
  ['Mayonesa HELLMANNS clas dp 475g', 'Mayonesa HELLMANNS clásica 475g'],
  ['Mayonesa NATURA 2.900cc', 'Mayonesa NATURA 2.9kg'],
  ['Mostaza NATURA 250ml', 'Mostaza NATURA 250g'],
  ['Puré de Tomate DE LA HUERTA 530g', 'Puré de tomate DE LA HUERTA 520g'],
  ['Salsa lista ARCOR dp 340ml', 'Salsa lista ARCOR pomarola 340g'],
  ['Tomate trit. OLIVARES DEL CESAR bot 950g', 'Tomate OLIVARES DEL CESAR triturado 950g'],
  ['Tomate perita ARCOR pelado 400g', 'Tomate ARCOR perita 400g'],
]

async function main() {
  let ok = 0, sinImagenVieja = 0, noEncontrado = 0
  for (const [nuevo, viejo] of pares) {
    const { data: viejoData } = await supabase.from('products').select('imagen_base64').eq('nombre', viejo).single()
    if (!viejoData) { console.log(`⚠ No encontré el producto viejo: "${viejo}"`); noEncontrado++; continue }
    if (!viejoData.imagen_base64) { console.log(`⚠ El viejo "${viejo}" no tiene imagen`); sinImagenVieja++; continue }

    const { error } = await supabase.from('products').update({ imagen_base64: viejoData.imagen_base64 }).eq('nombre', nuevo)
    if (error) { console.log(`✗ Error actualizando "${nuevo}": ${error.message}`) }
    else { console.log(`✓ ${nuevo} <- imagen de "${viejo}"`); ok++ }
  }
  console.log(`\nRecuperadas: ${ok} | Sin imagen origen: ${sinImagenVieja} | No encontrados: ${noEncontrado}`)
}

main()
