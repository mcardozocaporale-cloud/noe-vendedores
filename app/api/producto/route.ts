import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Cliente con permisos de administrador — SOLO se usa server-side, nunca se expone al navegador.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Alta manual de un producto que no viene del Excel (ej. algo puntual que solo se vende una vez).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, categoria, precio_unitario } = body

    if (!nombre || !categoria || precio_unitario == null) {
      return NextResponse.json({ error: 'Faltan datos: nombre, categoría y precio unitario son obligatorios.' }, { status: 400 })
    }

    const payload = {
      nombre,
      descripcion: body.descripcion || nombre,
      categoria,
      codigo: body.codigo || null,
      precio_unitario,
      precio_bulto: body.precio_bulto ?? precio_unitario,
      factor_bulto: body.factor_bulto || 1,
      precio_min: body.precio_min ?? null,
      stock: body.stock ?? 0,
      activo: body.activo ?? true,
      permite_ajuste_precio: false,
      imagen_base64: null,
    }

    const { data, error } = await supabaseAdmin.from('products').insert(payload).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, producto: data })
  } catch (err: any) {
    console.error('Error creando producto:', err)
    return NextResponse.json({ error: err.message || 'Error inesperado al crear el producto.' }, { status: 500 })
  }
}
