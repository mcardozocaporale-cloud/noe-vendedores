import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseExcelBuffer, sincronizarCatalogo } from '@/lib/excelSync'

export const runtime = 'nodejs'

// Cliente con permisos de administrador — SOLO se usa server-side, nunca se expone al navegador.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const categoriaOverride = (formData.get('categoria') as string | null) || undefined

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: 'El archivo debe ser un Excel (.xlsx o .xls).' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const filas = parseExcelBuffer(buffer)

    if (filas.length === 0) {
      return NextResponse.json({ error: 'No se encontraron productos en el Excel.' }, { status: 400 })
    }

    const resumen = await sincronizarCatalogo(supabaseAdmin, filas, categoriaOverride)

    return NextResponse.json({ ok: true, resumen, totalFilas: filas.length })
  } catch (err: any) {
    console.error('Error importando excel:', err)
    return NextResponse.json({ error: err.message || 'Error inesperado al procesar el archivo.' }, { status: 500 })
  }
}
