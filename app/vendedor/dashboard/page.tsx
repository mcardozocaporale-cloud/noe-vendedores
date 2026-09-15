'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency } from '@/lib/auth'
import { ESTADOS_ORDEN, EstadoBadge } from '@/lib/estados'
import { IconPlus } from '@/lib/icons'

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
        <div className="flex justify-between items-start gap-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-neo-dark">Hola, {vendor?.nombre}</h1>
            <p className="text-gray-500 text-sm">Así viene tu actividad en Neo Mercado.</p>
          </div>
          <Link href="/vendedor/clientes" className="btn-primary whitespace-nowrap inline-flex items-center gap-2">
            <IconPlus className="w-4 h-4" /> Nuevo Pedido
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total de Pedidos</div>
            <div className="text-3xl font-black text-neo-dark mt-1">{ordenes.length}</div>
          </div>
          <div className="card">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total Gastado</div>
            <div className="text-3xl font-black text-neo-dark mt-1">
              {formatCurrency(ordenes.reduce((sum, o) => sum + o.total, 0))}
            </div>
          </div>
          <div className="card border-l-4 border-l-neo-orange">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wide">Pedidos Pendientes</div>
            <div className="text-3xl font-black text-neo-orange mt-1">
              {ordenes.filter(o => o.estado === 'pendiente').length}
            </div>
          </div>
        </div>

        {/* Historial Órdenes */}
        <div className="card">
          <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
            <h2 className="text-xl font-bold text-neo-dark">Historial de Pedidos</h2>
            {ordenes.length > 0 && (
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="input-field w-auto text-sm"
              >
                <option value="">Todos los estados ({ordenes.length})</option>
                {ESTADOS_ORDEN.filter(e => conteosPorEstado.has(e.valor)).map(e => (
                  <option key={e.valor} value={e.valor}>
                    {e.label} ({conteosPorEstado.get(e.valor)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {ordenes.length === 0 ? (
            <p className="text-gray-600">No tenés pedidos aún. <Link href="/vendedor/clientes" className="text-neo-orange font-bold">Crear tu primer pedido</Link></p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wide">
                    <th className="p-2 text-left font-bold">Número</th>
                    <th className="p-2 text-left font-bold">Fecha</th>
                    <th className="p-2 text-left font-bold">Estado</th>
                    <th className="p-2 text-right font-bold">Total</th>
                    <th className="p-2 font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesFiltradas.map(orden => (
                    <tr key={orden.id} className="border-t border-gray-100 hover:bg-neo-light/60">
                      <td className="p-2 font-bold text-neo-dark">{orden.numero_orden}</td>
                      <td className="p-2 text-gray-500">{new Date(orden.created_at).toLocaleDateString('es-AR')}</td>
                      <td className="p-2">
                        <EstadoBadge valor={orden.estado} />
                      </td>
                      <td className="p-2 text-right font-bold text-neo-dark">{formatCurrency(orden.total)}</td>
                      <td className="p-2 text-center whitespace-nowrap">
                        <Link href={`/vendedor/orden/${orden.id}`} className="text-neo-orange font-bold hover:underline mr-3">
                          Ver
                        </Link>
                        {orden.estado === 'pendiente' && (
                          <Link href={`/vendedor/orden/${orden.id}/editar`} className="text-neo-lilac-dark font-bold hover:underline">
                            Editar
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
