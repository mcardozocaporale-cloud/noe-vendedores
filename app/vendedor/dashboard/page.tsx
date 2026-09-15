'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency } from '@/lib/auth'
import { ESTADOS_ORDEN, EstadoBadge } from '@/lib/estados'
import { IconPlus, IconTrash } from '@/lib/icons'

interface Vendor {
  id: string
  nombre: string
  empresa: string
}

interface Order {
  id: string
  numero_orden: string
  estado: string
  total: number
  created_at: string
}

export default function DashboardVendedor() {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [ordenes, setOrdenes] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [borrando, setBorrando] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }

    cargarDatos(session.vendorId)
  }, [router])

  async function cargarDatos(vendorId: string) {
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('id, nombre, empresa')
      .eq('id', vendorId)
      .single()

    if (vendorData) setVendor(vendorData)

    const { data: ordenesData } = await supabase
      .from('orders')
      .select('id, numero_orden, estado, total, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (ordenesData) setOrdenes(ordenesData)

    setLoading(false)
  }

  async function borrarOrden(orden: Order) {
    const ok = window.confirm(`¿Borrar el pedido ${orden.numero_orden}? Esta acción no se puede deshacer.`)
    if (!ok) return

    setBorrando(orden.id)
    const { error } = await supabase.from('orders').delete().eq('id', orden.id)
    setBorrando(null)

    if (error) {
      alert('No se pudo borrar el pedido: ' + error.message)
      return
    }
    setOrdenes(prev => prev.filter(o => o.id !== orden.id))
  }

  const ordenesFiltradas = useMemo(
    () => (filtroEstado ? ordenes.filter(o => o.estado === filtroEstado) : ordenes),
    [ordenes, filtroEstado]
  )

  const conteosPorEstado = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of ordenes) map.set(o.estado, (map.get(o.estado) || 0) + 1)
    return map
  }, [ordenes])

  if (loading) return <div className="text-center py-20">Cargando...</div>

  return (
    <div>
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center gap-3 mb-5">
          <div>
            <h1 className="text-lg font-semibold text-neo-dark">Hola, {vendor?.nombre}</h1>
            <p className="text-gray-500 text-xs">Así viene tu actividad en Neo Mercado.</p>
          </div>
          <Link href="/vendedor/clientes" className="btn-primary whitespace-nowrap inline-flex items-center gap-1.5">
            <IconPlus className="w-3.5 h-3.5" /> Nuevo pedido
          </Link>
        </div>

        {/* KPIs: una sola franja, no tres tarjetas separadas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-gray-200 rounded-lg mb-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          <div className="px-4 py-2.5 flex items-center justify-between sm:block">
            <div className="text-gray-500 text-[11px] font-medium uppercase tracking-wide">Total de pedidos</div>
            <div className="text-lg font-semibold text-neo-dark sm:mt-0.5">{ordenes.length}</div>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between sm:block">
            <div className="text-gray-500 text-[11px] font-medium uppercase tracking-wide">Total gastado</div>
            <div className="text-lg font-semibold text-neo-dark sm:mt-0.5">
              {formatCurrency(ordenes.reduce((sum, o) => sum + o.total, 0))}
            </div>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between sm:block">
            <div className="text-gray-500 text-[11px] font-medium uppercase tracking-wide">Pendientes</div>
            <div className="text-lg font-semibold text-neo-orange sm:mt-0.5">
              {ordenes.filter(o => o.estado === 'pendiente').length}
            </div>
          </div>
        </div>

        {/* Historial Órdenes */}
        <div className="card">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Historial de pedidos</h2>

          {ordenes.length === 0 ? (
            <p className="text-gray-600 text-sm">No tenés pedidos aún. <Link href="/vendedor/clientes" className="text-neo-orange font-semibold">Crear tu primer pedido</Link></p>
          ) : (
            <>
              {/* Resumen por estado — a la vez es el filtro */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
                <button
                  onClick={() => setFiltroEstado('')}
                  className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                    filtroEstado === '' ? 'bg-neo-dark text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos <span className="opacity-70">({ordenes.length})</span>
                </button>
                {ESTADOS_ORDEN.filter(e => conteosPorEstado.has(e.valor)).map(e => (
                  <button
                    key={e.valor}
                    onClick={() => setFiltroEstado(prev => (prev === e.valor ? '' : e.valor))}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                      filtroEstado === e.valor ? e.solid : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${filtroEstado === e.valor ? 'bg-white' : e.dot}`} />
                    {e.label} <span className="opacity-70">({conteosPorEstado.get(e.valor)})</span>
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-[11px] uppercase tracking-wide">
                      <th className="p-2 text-left font-semibold">Número</th>
                      <th className="p-2 text-left font-semibold">Fecha</th>
                      <th className="p-2 text-left font-semibold">Estado</th>
                      <th className="p-2 text-right font-semibold">Total</th>
                      <th className="p-2 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.map(orden => (
                      <tr key={orden.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-2 font-medium text-neo-dark font-mono text-[13px]">{orden.numero_orden}</td>
                        <td className="p-2 text-gray-500">{new Date(orden.created_at).toLocaleDateString('es-AR')}</td>
                        <td className="p-2">
                          <EstadoBadge valor={orden.estado} />
                        </td>
                        <td className="p-2 text-right font-medium text-neo-dark">{formatCurrency(orden.total)}</td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <Link href={`/vendedor/orden/${orden.id}`} className="text-neo-orange font-medium hover:underline mr-3">
                            Ver
                          </Link>
                          {orden.estado === 'pendiente' && (
                            <Link href={`/vendedor/orden/${orden.id}/editar`} className="text-neo-lilac-dark font-medium hover:underline mr-3">
                              Editar
                            </Link>
                          )}
                          <button
                            onClick={() => borrarOrden(orden)}
                            disabled={borrando === orden.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-40 align-middle"
                            aria-label="Borrar pedido"
                          >
                            <IconTrash className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
