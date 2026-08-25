import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Cliente con permisos de administrador — SOLO se usa server-side, nunca se expone al navegador.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, imagen_base64 } = body as { id?: string; imagen_base64?: string }

    if (!id || !imagen_base64) {
      return NextResponse.json({ error: 'Falta el id del producto o la imagen.' }, { status: 400 })
    }

    // Por si llega con el prefijo "data:image/...;base64," lo sacamos, guardamos solo el base64 puro.
    const limpio = imagen_base64.replace(/^data:image\/\w+;base64,/, '')

    const { error } = await supabaseAdmin.from('products').update({ imagen_base64: limpio }).eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error subiendo imagen de producto:', err)
    return NextResponse.json({ error: err.message || 'Error inesperado al subir la imagen.' }, { status: 500 })
  }
}
