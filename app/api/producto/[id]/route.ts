import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Cliente con permisos de administrador — SOLO se usa server-side, nunca se expone al navegador.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Campos editables a mano desde /vendedor/productos. Ojo: la mayoría de estos se pisan solos la
// próxima vez que se importe un Excel (que siempre manda) — la excepción es imagen_base64, que el
// importador nunca toca y por eso tiene su propia ruta (/api/producto-imagen).
const CAMPOS_EDITABLES = [
  'nombre',
  'descripcion',
  'categoria',
  'codigo',
  'precio_unitario',
  'precio_bulto',
  'factor_bulto',
  'precio_min',
  'stock',
  'activo',
] as const

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const payload: Record<string, unknown> = {}
    for (const campo of CAMPOS_EDITABLES) {
      if (campo in body) payload[campo] = body[campo]
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No se mandó ningún campo para actualizar.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from('products').update(payload).eq('id', id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, producto: data })
  } catch (err: any) {
    console.error('Error editando producto:', err)
    return NextResponse.json({ error: err.message || 'Error inesperado al editar el producto.' }, { status: 500 })
  }
}
