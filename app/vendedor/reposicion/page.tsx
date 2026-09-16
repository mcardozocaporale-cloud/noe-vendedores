'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency } from '@/lib/auth'
import { IconPlus } from '@/lib/icons'

const ADMIN_EMAIL = 'admin@neomercado.com'
const VENTANA_DIAS = 30

interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  stock: number
  precio_unitario: number
}

interface OfertaGuardada {
  precio: number
  proveedor: string | null
  fecha: string
}

interface FilaReposicion {
  producto: Producto
  vendidos30d: number
  diasRestantes: number
  ultimaOferta: OfertaGuardada | null
}

export default function Reposicion() {
  const router = useRouter()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [autorizado, setAutorizado] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const [productos, setProductos] = useState<Producto[]>([])
  const [ventasPorProducto, setVentasPorProducto] = useState<Map<string, number>>(new Map())
  const [ofertasPorProducto, setOfertasPorProducto] = useState<Map<string, OfertaGuardada>>(new Map())

  const [sumando, setSumando] = useState<string | null>(null)
  const [cantidadASumar, setCantidadASumar] = useState<Record<string, string>>({})

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
    cargarDatos(vendorId)
  }, [vendorId, autorizado])

  async function cargarDatos(vendorId: string) {
    setLoading(true)

    const { data: productosData } = await supabase
      .from('products')
      .select('id, nombre, descripcion, stock, precio_unitario')
      .eq('activo', true)

    setProductos(productosData || [])

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - VENTANA_DIAS)

    const { data: ordenesRecientes } = await supabase
      .from('orders')
      .select('id')
      .eq('vendor_id', vendorId)
      .gte('created_at', cutoff.toISOString())
      .neq('estado', 'cancelado')

    const idsOrdenes = (ordenesRecientes || []).map(o => o.id)

    const ventasMap = new Map<string, number>()
    if (idsOrdenes.length > 0) {
      const { data: itemsVendidos } = await supabase
        .from('order_items')
        .select('product_id, cantidad')
        .in('order_id', idsOrdenes)

      for (const item of itemsVendidos || []) {
        ventasMap.set(item.product_id, (ventasMap.get(item.product_id) || 0) + item.cantidad)
      }
    }
    setVentasPorProducto(ventasMap)

    const { data: ofertas } = await supabase
      .from('ofertas_proveedores')
      .select('items, proveedor, created_at')
      .eq('vendor_id', vendorId)
      .eq('estado', 'lista')
      .order('created_at', { ascending: false })

    const ofertasMap = new Map<string, OfertaGuardada>()
    for (const oferta of ofertas || []) {
      for (const item of (oferta.items || []) as any[]) {
        if (item.producto_id && !ofertasMap.has(item.producto_id)) {
          ofertasMap.set(item.producto_id, {
            precio: item.precio_detectado,
            proveedor: oferta.proveedor,
            fecha: oferta.created_at,
          })
        }
      }
    }
    setOfertasPorProducto(ofertasMap)

    setLoading(false)
  }

  const filas = useMemo<FilaReposicion[]>(() => {
    const resultado: FilaReposicion[] = []
    for (const producto of productos) {
      const vendidos30d = ventasPorProducto.get(producto.id) || 0
      if (vendidos30d === 0) continue // sin ventas recientes no hay señal de qué reponer

      const diasRestantes = producto.stock / (vendidos30d / VENTANA_DIAS)
      resultado.push({
        producto,
        vendidos30d,
        diasRestantes,
        ultimaOferta: ofertasPorProducto.get(producto.id) || null,
      })
    }
    return resultado.sort((a, b) => a.diasRestantes - b.diasRestantes)
  }, [productos, ventasPorProducto, ofertasPorProducto])

  async function sumarStock(producto: Producto) {
    const cantidad = parseInt(cantidadASumar[producto.id] || '', 10)
    if (!cantidad || cantidad <= 0) return

    setSumando(producto.id)
    try {
      const res = await fetch(`/api/producto/${producto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: producto.stock + cantidad }),
      })
      if (!res.ok) throw new Error()

      setProductos(prev => prev.map(p => (p.id === producto.id ? { ...p, stock: p.stock + cantidad } : p)))
      setCantidadASumar(prev => ({ ...prev, [producto.id]: '' }))
    } catch {
      alert('No se pudo actualizar el stock. Probá de nuevo.')
    } finally {
      setSumando(null)
    }
  }

  if (autorizado === null || loading) return <div className="text-center py-20">Cargando...</div>

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
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-neo-dark tracking-tight leading-tight">Qué reponer</h1>
        <p className="text-gray-500 text-xs">
          Productos que se vendieron en los últimos {VENTANA_DIAS} días, ordenados por cuánto stock les queda.
        </p>
        <p className="text-gray-400 text-xs mt-1">
          El stock se carga a mano o por Excel — si no está actualizado, estos números no son exactos.
        </p>
      </div>

      {filas.length === 0 ? (
        <p className="text-gray-500 text-sm py-2">No hay productos con ventas en los últimos {VENTANA_DIAS} días.</p>
      ) : (
        <div className="card overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-2 py-1.5 font-semibold">Producto</th>
                <th className="px-2 py-1.5 font-semibold">Stock</th>
                <th className="px-2 py-1.5 font-semibold">Vendido ({VENTANA_DIAS}d)</th>
                <th className="px-2 py-1.5 font-semibold">Días restantes</th>
                <th className="px-2 py-1.5 font-semibold">Última oferta guardada</th>
                <th className="px-2 py-1.5 font-semibold">Sumar stock</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ producto, vendidos30d, diasRestantes, ultimaOferta }) => {
                const urgente = diasRestantes <= 7
                return (
                  <tr key={producto.id} className="border-t border-gray-100">
                    <td className="px-2 py-2">
                      <div className="font-semibold text-neo-dark">{producto.nombre}</div>
                      {producto.descripcion && producto.descripcion !== producto.nombre && (
                        <div className="text-xs text-gray-500">{producto.descripcion}</div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-gray-600">{producto.stock}</td>
                    <td className="px-2 py-2 text-gray-600">{vendidos30d}</td>
                    <td className="px-2 py-2">
                      <span className={urgente ? 'inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5' : 'text-gray-600'}>
                        {diasRestantes > 90 ? '90+' : Math.max(0, Math.round(diasRestantes))} días{urgente ? ' — Urgente' : ''}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-gray-600">
                      {ultimaOferta ? (
                        <>
                          <div className="font-semibold text-neo-dark">{formatCurrency(ultimaOferta.precio)}</div>
                          <div className="text-xs text-gray-500">
                            {ultimaOferta.proveedor || 'Proveedor sin nombre'} · {new Date(ultimaOferta.fecha).toLocaleDateString('es-AR')}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          placeholder="0"
                          value={cantidadASumar[producto.id] || ''}
                          onChange={e => setCantidadASumar(prev => ({ ...prev, [producto.id]: e.target.value }))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => sumarStock(producto)}
                          disabled={sumando === producto.id}
                          className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1 whitespace-nowrap disabled:opacity-40"
                        >
                          <IconPlus className="w-3 h-3" /> Sumar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
