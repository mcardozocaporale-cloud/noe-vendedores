// Genera el "folder" (HTML imprimible) siguiendo el criterio exacto del usuario:
// - Subrubro (= categoria en nuestra base) = una página
// - Dentro de cada página: agrupado por Marca (extraída del nombre), ordenado por Precio asc dentro de cada marca
// - Activo=1: banda negra (Precio) + banda naranja (Precio Vol) o lila (Precio Liq) si especial=SI (nunca ambas)
// - Activo=0: imagen al 50%, leyenda "sin stock", sin bandas de precio
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const { loadEnvLocal } = require('./_env')
const env = loadEnvLocal()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

function extraerMarca(nombre) {
  const palabras = nombre.split(/\s+/)
  const esMayusConLetra = w => /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(w) && w === w.toUpperCase()
  let inicio = -1
  for (let i = 0; i < palabras.length; i++) {
    if (esMayusConLetra(palabras[i])) { inicio = i; break }
  }
  if (inicio === -1) return palabras[0] || ''
  let fin = inicio
  while (fin + 1 < palabras.length && esMayusConLetra(palabras[fin + 1])) fin++
  return palabras.slice(inicio, fin + 1).join(' ')
}

function money(n) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

async function main() {
  const categorias = process.argv.slice(2)
  if (categorias.length === 0) {
    console.error('Uso: node generar-folder.js "Categoria1" "Categoria2" ...')
    process.exit(1)
  }

  const { data: productos, error } = await supabase
    .from('products')
    .select('nombre, categoria, factor_bulto, precio_unitario, precio_bulto, precio_min, permite_ajuste_precio, activo, imagen_base64')
    .in('categoria', categorias)

  if (error) { console.error(error); process.exit(1) }

  const porCategoria = new Map()
  for (const p of productos) {
    if (!porCategoria.has(p.categoria)) porCategoria.set(p.categoria, [])
    porCategoria.get(p.categoria).push(p)
  }

  let paginasHtml = ''
  let totalSinFoto = 0

  for (const categoria of categorias) {
    const items = porCategoria.get(categoria) || []
    // Agrupar por marca
    const porMarca = new Map()
    for (const p of items) {
      const marca = extraerMarca(p.nombre)
      if (!porMarca.has(marca)) porMarca.set(marca, [])
      porMarca.get(marca).push(p)
    }
    // Orden: Marca (alfabético) -> Precio ascendente dentro de cada marca
    const marcasOrdenadas = Array.from(porMarca.keys()).sort((a, b) => a.localeCompare(b, 'es'))
    const productosOrdenados = []
    for (const marca of marcasOrdenadas) {
      const grupo = porMarca.get(marca).sort((a, b) => a.precio_unitario - b.precio_unitario)
      productosOrdenados.push(...grupo)
    }

    const cards = productosOrdenados.map(p => {
      if (!p.imagen_base64) totalSinFoto++
      const img = p.imagen_base64
        ? `<img src="data:image/png;base64,${p.imagen_base64}" alt="${p.nombre}" />`
        : `<div class="sinimg">Sin foto</div>`

      if (!p.activo) {
        return `
        <div class="card inactivo">
          <span class="factor">${p.factor_bulto}</span>
          <div class="imgwrap dim">${img}</div>
          <div class="nombre">${p.nombre}</div>
          <div class="sinstock">sin stock</div>
        </div>`
      }

      const bandaSecundaria = p.permite_ajuste_precio
        ? `<div class="precio lila">${money(p.precio_min)}</div>`
        : `<div class="precio naranja">${money(p.precio_bulto)}</div>`

      return `
      <div class="card">
        <span class="factor">${p.factor_bulto}</span>
        <div class="imgwrap">${img}</div>
        <div class="nombre">${p.nombre}</div>
        <div class="precio negro">${money(p.precio_unitario)}</div>
        ${bandaSecundaria}
      </div>`
    }).join('\n')

    paginasHtml += `
    <section class="pagina">
      <header>
        <div class="pill">${categoria}</div>
        <div class="nm">NEO <b>MERCADO</b></div>
      </header>
      <div class="grid">${cards}</div>
    </section>
    `
  }

  const html = `<title>Folder Neo Mercado</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #fff; color: #111; margin: 0; }
  .no-print { text-align: right; padding: 12px 24px; }
  .btn-print { font-weight: 700; background: #F2843B; color: #fff; border: none; border-radius: 6px; padding: 10px 18px; cursor: pointer; font-size: 13px; }
  .pagina { max-width: 900px; margin: 0 auto 40px; padding: 24px; page-break-after: always; }
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .pill { background: #E4CFF2; border-radius: 16px; padding: 10px 28px; font-weight: 900; font-size: 20px; }
  .nm { font-weight: 900; font-size: 20px; }
  .nm b { color: #F2843B; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .card { position: relative; border: 2px solid #111; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column; }
  .imgwrap { background: #fff; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #111; }
  .imgwrap img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
  .imgwrap.dim img { opacity: 0.5; }
  .sinimg { font-size: 11px; color: #999; }
  .factor { position: absolute; z-index: 2; top: 0; left: 0; background: #E4CFF2; font-weight: 900; font-size: 15px; padding: 3px 8px; }
  .nombre { font-weight: 700; font-size: 11px; text-align: center; padding: 6px 4px; min-height: 40px; display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #111; }
  .card.inactivo .nombre { border-bottom: none; }
  .precio { text-align: center; font-weight: 900; font-size: 16px; padding: 6px 4px; }
  .precio.negro { background: #111; color: #fff; }
  .precio.naranja { background: #F2843B; color: #111; }
  .precio.lila { background: #E4CFF2; color: #111; }
  .sinstock { text-align: center; font-weight: 900; font-size: 13px; padding: 10px 4px; color: #b91c1c; text-transform: uppercase; }
  @media print { .no-print { display: none; } .pagina { page-break-after: always; } }
</style>
<div class="no-print"><button class="btn-print" onclick="window.print()">⭳ Descargar / Imprimir PDF</button></div>
${paginasHtml}
`

  fs.writeFileSync('C:/Users/Usuario/AppData/Local/Temp/claude/C--Users-Usuario-Desktop-Neo/d0b33c3f-26ae-403e-bda5-4a9d67cebbe2/scratchpad/folder-neo-mercado.html', html)
  console.log(`OK. ${categorias.length} páginas generadas. Productos sin foto: ${totalSinFoto}`)
}

main()
