'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency } from '@/lib/auth'
import { ESTADOS_ORDEN, EstadoBadge } from '@/lib/estados'
import { IconPlus, IconMoreHorizontal, IconTrash, IconEdit } from '@/lib/icons'

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
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }

    cargarDatos(session.vendorId)
  }, [router])

  useEffect(() => {
    function cerrarAlClickearAfuera(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-row-menu]')) setMenuAbierto(null)
    }
    document.addEventListener('click', cerrarAlClickearAfuera)
    return () => document.removeEventListener('click', cerrarAlClickearAfuera)
  }, [])

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

  // Los cancelados no cuentan como actividad real: si se dejan adentro, un solo pedido
  // cancelado por error (pasó con uno de prueba) puede inflar "Total vendido" sin sentido.
  const ordenesValidas = useMemo(() => ordenes.filter(o => o.estado !== 'cancelado'), [ordenes])
  const totalVendido = useMemo(() => ordenesValidas.reduce((sum, o) => sum + o.total, 0), [ordenesValidas])
  const pendientes = useMemo(() => ordenes.filter(o => o.estado === 'pendiente').length, [ordenes])

  if (loading) return <div className="text-center py-20">Cargando...</div>

  return (
    <div>
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center gap-3 mb-5">
          <div>
            <h1 className="text-base font-semibold text-neo-dark">Dashboard</h1>
            <p className="text-gray-500 text-xs">Resumen de actividad y pedidos.</p>
          </div>
          <Link href="/vendedor/clientes" className="btn-primary whitespace-nowrap inline-flex items-center gap-1.5">
            <IconPlus className="w-3.5 h-3.5" /> Nuevo pedido
          </Link>
        </div>

        {/* KPIs: los números son lo importante, no la caja que los contiene */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-gray-200 rounded-lg mb-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          <div className="px-4 py-3 flex items-center justify-between sm:block">
            <div className="text-gray-500 text-[11px] font-medium uppercase tracking-wide">Pedidos</div>
            <div className="text-2xl font-bold text-neo-dark sm:mt-0.5">{ordenesValidas.length}</div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between sm:block">
            <div className="text-gray-500 text-[11px] font-medium uppercase tracking-wide">Total vendido</div>
            <div className="text-2xl font-bold text-neo-dark sm:mt-0.5">{formatCurrency(totalVendido)}</div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between sm:block">
            <div className="text-gray-500 text-[11px] font-medium uppercase tracking-wide">Pendientes</div>
            <div className="text-2xl font-bold text-neo-orange sm:mt-0.5">{pendientes}</div>
          </div>
        </div>

        {/* Pedidos */}
        <div className="card">
          <h2 className="text-base font-semibold text-neo-dark mb-3">Pedidos</h2>

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
                      <th className="p-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.map(orden => (
                      <tr key={orden.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-2 text-gray-400 font-mono text-xs">{orden.numero_orden}</td>
                        <td className="p-2 text-gray-500">{new Date(orden.created_at).toLocaleDateString('es-AR')}</td>
                        <td className="p-2">
                          <EstadoBadge valor={orden.estado} />
                        </td>
                        <td className="p-2 text-right font-semibold text-neo-dark">{formatCurrency(orden.total)}</td>
                        <td className="p-2 text-right whitespace-nowrap">
                          <Link href={`/vendedor/orden/${orden.id}`} className="text-neo-orange font-semibold hover:underline">
                            Ver
                          </Link>
                          <span className="relative inline-block ml-2" data-row-menu>
                            <button
                              onClick={() => setMenuAbierto(prev => (prev === orden.id ? null : orden.id))}
                              className="text-gray-400 hover:text-gray-600 p-1 align-middle"
                              aria-label="Más acciones"
                            >
                              <IconMoreHorizontal className="w-4 h-4" />
                            </button>
                            {menuAbierto === orden.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-sm z-10 py-1 text-left">
                                {orden.estado === 'pendiente' && (
                                  <Link
                                    href={`/vendedor/orden/${orden.id}/editar`}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <IconEdit className="w-3.5 h-3.5" /> Editar
                                  </Link>
                                )}
                                <button
                                  onClick={() => { setMenuAbierto(null); borrarOrden(orden) }}
                                  disabled={borrando === orden.id}
                                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 w-full disabled:opacity-40"
                                >
                                  <IconTrash className="w-3.5 h-3.5" /> Borrar
                                </button>
                              </div>
                            )}
                          </span>
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
