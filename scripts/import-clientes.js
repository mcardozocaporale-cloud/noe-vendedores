// Carga (o actualiza) los clientes reales desde "Clientes NEO MERCADO.xlsx" a la tabla `clientes`,
// todos bajo la cuenta Admin por ahora. Matchea por codigo_cliente (N° Cliente del Excel) para que
// se pueda volver a correr sin duplicar si el Excel se actualiza.
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const { loadEnvLocal } = require('./_env')

const env = loadEnvLocal()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const wb = XLSX.readFile('../Clientes NEO MERCADO.xlsx')
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  const { data: admin, error: adminErr } = await supabase
    .from('vendors')
    .select('id')
    .eq('email', 'admin@neomercado.com')
    .single()
  if (adminErr || !admin) throw new Error('No se encontró la cuenta Admin: ' + adminErr?.message)

  const vistos = new Set()
  const clientes = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r[0]) continue
    const codigo_cliente = String(r[0]).trim()
    if (vistos.has(codigo_cliente)) continue // fila duplicada en el excel, se ignora
    vistos.add(codigo_cliente)
    clientes.push({
      vendor_id: admin.id,
      codigo_cliente,
      nombre: String(r[1] || '').trim(),
      apellido: '',
      direccion: r[2] ? String(r[2]).trim() : null,
      vendedor_codigo: r[3] ? String(r[3]).trim() : null,
      forma_pago: r[4] ? String(r[4]).trim() : null,
    })
  }

  console.log('Clientes a cargar:', clientes.length)

  const { error } = await supabase.from('clientes').upsert(clientes, { onConflict: 'codigo_cliente' })
  if (error) throw error

  const { count } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
  console.log('OK. Total de clientes en la base ahora:', count)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
