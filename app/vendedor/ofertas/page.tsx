'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { comprimirImagen } from '@/lib/imageUtils'
import { IconCamera, IconAlertTriangle, IconTag, IconChevronDown } from '@/lib/icons'
import { InfoDosier, DosierSeccion, DosierEjemplo, DosierBotonAyuda } from '@/components/InfoDosier'

const ADMIN_EMAIL = 'admin@neomercado.com'

interface ItemOferta {
  producto_detectado: string
  precio_detectado: number
  unidad: string
  producto_id: string | null
  precio_venta_actual: number | null
  precio_oferta_anterior: number | null
}

interface Oferta {
  id: string
  proveedor: string | null
  fuente: 'foto' | 'texto'
  items: ItemOferta[]
  estado: 'procesando' | 'lista' | 'error'
  error_mensaje: string | null
  created_at: string
}

function formatCurrency(n: number) {
  return `$ ${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
}

function TablaItems({ items }: { items: ItemOferta[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 py-2">No se detectaron productos en esta oferta.</p>
  }
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-1 py-1.5 font-semibold">Producto detectado</th>
            <th className="px-1 py-1.5 font-semibold">Precio ofertado</th>
            <th className="px-1 py-1.5 font-semibold">Tu precio de venta</th>
            <th className="px-1 py-1.5 font-semibold">Oferta anterior</th>
            <th className="px-1 py-1.5 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const bajoVsAnterior = item.precio_oferta_anterior != null && item.precio_detectado < item.precio_oferta_anterior
            const subioVsAnterior = item.precio_oferta_anterior != null && item.precio_detectado > item.precio_oferta_anterior
            return (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-1 py-2">
                  <div className="font-semibold text-neo-dark">{item.producto_detectado}</div>
                  <div className="text-xs text-gray-500">{item.unidad}</div>
                </td>
                <td className="px-1 py-2 font-bold text-neo-dark">{formatCurrency(item.precio_detectado)}</td>
                <td className="px-1 py-2 text-gray-600">
                  {item.precio_venta_actual != null ? formatCurrency(item.precio_venta_actual) : '—'}
                </td>
                <td className="px-1 py-2 text-gray-600">
                  {item.precio_oferta_anterior != null ? formatCurrency(item.precio_oferta_anterior) : '—'}
                </td>
                <td className="px-1 py-2">
                  {item.producto_id === null ? (
                    <span className="text-xs text-gray-400">Sin coincidencia</span>
                  ) : bajoVsAnterior ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                      Bajó — conviene
                    </span>
                  ) : subioVsAnterior ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                      Subió
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function OfertasProveedores() {
  const router = useRouter()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [autorizado, setAutorizado] = useState<boolean | null>(null)

  const [proveedor, setProveedor] = useState('')
  const [modo, setModo] = useState<'foto' | 'texto'>('foto')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [texto, setTexto] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  const [historial, setHistorial] = useState<Oferta[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [dosierAbierto, setDosierAbierto] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }
    setVendorId(session.vendorId)
    setAutorizado(session.email === ADMIN_EMAIL)
  }, [router])

  useEffect(() => {
    if (!vendorId || autorizado !== true) return
    cargarHistorial()
  }, [vendorId, autorizado])

  async function cargarHistorial() {
    setCargandoHistorial(true)
    const { data } = await supabase
      .from('ofertas_proveedores')
      .select('id, proveedor, fuente, items, estado, error_mensaje, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(20)
    setHistorial((data as Oferta[]) || [])
    setCargandoHistorial(false)
  }

  async function procesarOferta(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (modo === 'foto' && !archivo) {
      setError('Elegí una foto de la oferta primero.')
      return
    }
    if (modo === 'texto' && !texto.trim()) {
      setError('Pegá el texto de la oferta primero.')
      return
    }

    setProcesando(true)
    try {
      const payload: Record<string, unknown> = {
        vendor_id: vendorId,
        proveedor: proveedor.trim() || null,
        fuente: modo,
      }
      if (modo === 'foto' && archivo) {
        payload.imagen_base64 = await comprimirImagen(archivo)
      } else {
        payload.texto_original = texto.trim()
      }

      const res = await fetch('/api/ofertas-proveedores/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al procesar la oferta.')

      setArchivo(null)
      setTexto('')
      setProveedor('')
      await cargarHistorial()
      if (data.oferta) setExpandida(data.oferta.id)
    } catch (err: any) {
      setError(err.message || 'Error al procesar la oferta.')
    } finally {
      setProcesando(false)
    }
  }

  if (autorizado === null) return <div className="text-center py-20">Cargando...</div>

  if (!autorizado) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">No tenés permiso para acceder a esta sección.</p>
          <Link href="/vendedor/dashboard" className="btn-primary">← Volver</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-neo-dark tracking-tight leading-tight">Ofertas de proveedores</h1>
          <DosierBotonAyuda onClick={() => setDosierAbierto(true)} />
        </div>
        <p className="text-gray-500 text-xs">
          Subí la foto o el texto de una oferta que te llegó por WhatsApp — la comparamos contra tu catálogo y tus ofertas anteriores.
        </p>
      </div>

      <InfoDosier open={dosierAbierto} onClose={() => setDosierAbierto(false)} title="Ofertas de proveedores" icon={IconTag}>
        <DosierSeccion titulo="El problema que resuelve">
          <p>
            Hoy una oferta que llega por WhatsApp se lee una vez y se pierde. No hay forma de acordarse qué te ofreció
            cada proveedor la semana pasada, ni de comparar sistemáticamente contra lo que ya vendés — terminás
            comprando por costumbre, no por el mejor precio disponible ese día.
          </p>
        </DosierSeccion>

        <DosierSeccion titulo="Cómo funciona">
          <ol className="list-decimal list-inside space-y-1">
            <li>Subís la foto o pegás el texto tal cual te lo mandaron.</li>
            <li>Una IA lee la imagen o el texto y extrae productos y precios automáticamente.</li>
            <li>El sistema busca cada producto en tu catálogo y lo cruza con la última vez que ese mismo producto apareció en otra oferta.</li>
            <li>Te marca "Bajó — conviene" cuando el precio de hoy es mejor que el anterior.</li>
          </ol>
        </DosierSeccion>

        <DosierSeccion titulo="Beneficio concreto (con datos reales ya cargados)">
          <p className="mb-2">
            Con solo 4 catálogos que se subieron de prueba, el sistema ya encontró algo accionable: tu proveedor
            habitual te cobra el aceite más caro que dos ofertas puntuales de otros mayoristas.
          </p>
          <DosierEjemplo>
            <p><b>Aceite Cañuelas 1.5L</b> — Makro $4.939 → Diarco $4.929 (bajó) → tu depósito habitual $5.375 (subió)</p>
            <p><b>Aceite Cañuelas 900cc</b> — tu depósito habitual $3.380 → Maxiconsumo $3.000 (bajó $380 por botella)</p>
          </DosierEjemplo>
          <p className="mt-2">
            Multiplicado por el volumen que se compra por mes, esa diferencia es plata real — y sin esta pantalla,
            nadie la iba a notar porque las dos ofertas llegaron en momentos distintos, por proveedores distintos.
          </p>
        </DosierSeccion>

        <DosierSeccion titulo="Qué falta para que lea las fotos sola">
          <p>
            La lectura automática de imágenes necesita una API de IA paga (centavos por oferta procesada). Mientras
            no esté activada, se puede seguir cargando lo mismo a mano o pidiendo ayuda para procesar las ofertas —
            el resto de la pantalla (comparación, historial, alertas de "conviene") funciona igual.
          </p>
        </DosierSeccion>
      </InfoDosier>

      <form onSubmit={procesarOferta} className="card mb-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Proveedor <span className="font-normal text-gray-500">(opcional)</span></label>
          <input
            type="text"
            placeholder="Ej: Distribuidora del Sur"
            value={proveedor}
            onChange={e => setProveedor(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setModo('foto')}
            className={modo === 'foto' ? 'btn-primary flex-1 text-sm' : 'btn-secondary flex-1 text-sm'}
          >
            Foto
          </button>
          <button
            type="button"
            onClick={() => setModo('texto')}
            className={modo === 'texto' ? 'btn-primary flex-1 text-sm' : 'btn-secondary flex-1 text-sm'}
          >
            Texto
          </button>
        </div>

        {modo === 'foto' ? (
          <div className="mb-4">
            <label className="btn-secondary cursor-pointer inline-flex items-center gap-2 w-full justify-center">
              <IconCamera className="w-4 h-4" />
              {archivo ? archivo.name : 'Elegir foto de la oferta'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setArchivo(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        ) : (
          <div className="mb-4">
            <textarea
              placeholder="Pegá acá el texto de la oferta tal como te lo mandó el proveedor..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={5}
              className="input-field"
            />
          </div>
        )}

        <button type="submit" disabled={procesando} className="btn-primary w-full">
          {procesando ? 'Procesando...' : 'Procesar oferta'}
        </button>
      </form>

      <p className="nav-section-label !mt-0 !px-0">Historial</p>

      {cargandoHistorial && <p className="text-gray-500 text-sm py-2">Cargando...</p>}

      {!cargandoHistorial && historial.length === 0 && (
        <p className="text-gray-500 text-sm py-2">Todavía no procesaste ninguna oferta.</p>
      )}

      <div className="space-y-2">
        {historial.map(oferta => (
          <div key={oferta.id} className="card">
            <button
              onClick={() => setExpandida(expandida === oferta.id ? null : oferta.id)}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconTag className="w-4 h-4 text-neo-orange flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-neo-dark truncate">{oferta.proveedor || 'Proveedor sin nombre'}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(oferta.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {oferta.estado === 'lista' && ` · ${oferta.items.length} producto${oferta.items.length === 1 ? '' : 's'}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {oferta.estado === 'error' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                    <IconAlertTriangle className="w-3.5 h-3.5" /> Error
                  </span>
                )}
                <IconChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandida === oferta.id ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandida === oferta.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {oferta.estado === 'error' ? (
                  <p className="text-sm text-red-600">{oferta.error_mensaje || 'No se pudo procesar esta oferta.'}</p>
                ) : (
                  <TablaItems items={oferta.items} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
