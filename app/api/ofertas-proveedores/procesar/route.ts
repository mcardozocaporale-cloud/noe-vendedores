import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { matchearProducto } from '@/lib/matchOferta'

export const runtime = 'nodejs'

// Cliente con permisos de administrador — SOLO se usa server-side, nunca se expone al navegador.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ItemExtraido {
  producto: string
  precio: number
  unidad: string
}

const PROMPT_SISTEMA = `Sos un asistente que lee ofertas y catálogos de proveedores mayoristas de almacén/despensa,
enviados como foto o texto de WhatsApp, y extrae los productos con sus precios.

Devolvé ÚNICAMENTE un array JSON válido, sin texto antes ni después, con este formato exacto:
[{"producto": "nombre del producto tal como aparece", "precio": 1234.5, "unidad": "unitario"}]

- "precio" es un número (sin símbolo de moneda, sin separadores de miles con punto — usá el número puro).
- "unidad" es "unitario" salvo que el precio sea explícitamente por bulto/caja/pack, en cuyo caso describí la
  presentación tal cual aparece (ej. "bulto x12").
- Si no se puede leer ningún producto con precio, devolvé [].
- No inventes productos ni precios que no estén en la oferta.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vendor_id, proveedor, fuente, imagen_base64, texto_original } = body as {
      vendor_id?: string
      proveedor?: string
      fuente?: 'foto' | 'texto'
      imagen_base64?: string
      texto_original?: string
    }

    if (!vendor_id || !fuente) {
      return NextResponse.json({ error: 'Falta vendor_id o fuente.' }, { status: 400 })
    }
    if (fuente === 'foto' && !imagen_base64) {
      return NextResponse.json({ error: 'Falta la imagen de la oferta.' }, { status: 400 })
    }
    if (fuente === 'texto' && !texto_original?.trim()) {
      return NextResponse.json({ error: 'Falta el texto de la oferta.' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'La IA todavía no está configurada (falta ANTHROPIC_API_KEY). Avisale al admin del proyecto.' },
        { status: 503 }
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const content: Anthropic.MessageParam['content'] = fuente === 'foto'
      ? [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imagen_base64!.replace(/^data:image\/\w+;base64,/, '') } },
          { type: 'text', text: 'Extraé los productos y precios de esta oferta.' },
        ]
      : [{ type: 'text', text: `Extraé los productos y precios de esta oferta:\n\n${texto_original}` }]

    let itemsExtraidos: ItemExtraido[] = []
    try {
      const respuesta = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: PROMPT_SISTEMA,
        messages: [{ role: 'user', content }],
      })
      const textoRespuesta = respuesta.content.find(b => b.type === 'text')?.text || '[]'
      const jsonMatch = textoRespuesta.match(/\[[\s\S]*\]/)
      itemsExtraidos = JSON.parse(jsonMatch ? jsonMatch[0] : textoRespuesta)
    } catch (iaError: any) {
      console.error('Error procesando oferta con IA:', iaError)
      const { data: filaError } = await supabaseAdmin
        .from('ofertas_proveedores')
        .insert({
          vendor_id,
          proveedor: proveedor || null,
          fuente,
          imagen_base64: fuente === 'foto' ? imagen_base64 : null,
          texto_original: fuente === 'texto' ? texto_original : null,
          items: [],
          estado: 'error',
          error_mensaje: 'No se pudo leer la oferta. Probá con una foto más clara o pegando el texto.',
        })
        .select()
        .single()
      return NextResponse.json({ error: 'No se pudo leer la oferta.', oferta: filaError }, { status: 502 })
    }

    // Traemos el catálogo del vendor para matchear cada producto detectado.
    const { data: productos } = await supabaseAdmin
      .from('products')
      .select('id, nombre, descripcion, precio_unitario, precio_bulto')

    // Ofertas anteriores del mismo vendor, para comparar tendencia de precio por producto.
    const { data: ofertasPrevias } = await supabaseAdmin
      .from('ofertas_proveedores')
      .select('items, created_at')
      .eq('vendor_id', vendor_id)
      .eq('estado', 'lista')
      .order('created_at', { ascending: false })
      .limit(50)

    const precioAnteriorPorProducto = new Map<string, number>()
    for (const oferta of ofertasPrevias || []) {
      for (const item of (oferta.items || []) as any[]) {
        if (item.producto_id && !precioAnteriorPorProducto.has(item.producto_id)) {
          precioAnteriorPorProducto.set(item.producto_id, item.precio_detectado)
        }
      }
    }

    const itemsEnriquecidos = itemsExtraidos.map(item => {
      const match = matchearProducto(item.producto, productos || [])
      return {
        producto_detectado: item.producto,
        precio_detectado: item.precio,
        unidad: item.unidad || 'unitario',
        producto_id: match?.id || null,
        precio_venta_actual: match?.precio_unitario ?? null,
        precio_oferta_anterior: match ? precioAnteriorPorProducto.get(match.id) ?? null : null,
      }
    })

    const { data: ofertaGuardada, error: dbError } = await supabaseAdmin
      .from('ofertas_proveedores')
      .insert({
        vendor_id,
        proveedor: proveedor || null,
        fuente,
        imagen_base64: fuente === 'foto' ? imagen_base64 : null,
        texto_original: fuente === 'texto' ? texto_original : null,
        items: itemsEnriquecidos,
        estado: 'lista',
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, oferta: ofertaGuardada })
  } catch (err: any) {
    console.error('Error procesando oferta de proveedor:', err)
    return NextResponse.json({ error: err.message || 'Error inesperado al procesar la oferta.' }, { status: 500 })
  }
}
