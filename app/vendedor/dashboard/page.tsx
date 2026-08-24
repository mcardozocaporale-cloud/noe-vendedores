'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, clearSession, formatCurrency } from '@/lib/auth'

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

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }

    cargarDatos(session.vendorId)
  }, [router])

  async function cargarDatos(vendorId: string) {
    // Cargar datos del vendedor
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('id, nombre, empresa')
      .eq('id', vendorId)
      .single()

    if (vendorData) {
      setVendor(vendorData)
    }

    // Cargar órdenes del vendedor
    const { data: ordenesData } = await supabase
      .from('orders')
      .select('id, numero_orden, estado, total, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordenesData) {
      setOrdenes(ordenesData)
    }

    setLoading(false)
  }

  function handleLogout() {
    clearSession()
    router.push('/vendedor/login')
  }

  if (loading) return <div className="text-center py-20">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-neo-orange text-white py-4 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black">NEO MERCADO</h1>
            <p className="text-sm opacity-90">Bienvenido, {vendor?.nombre}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/vendedor/clientes" className="btn-primary">
              ⊕ Nuevo Pedido
            </Link>
            <Link href="/vendedor/carrito" className="btn-secondary">
              🛒 Mi Carrito
            </Link>
            <button onClick={handleLogout} className="btn-secondary">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="text-gray-600 text-sm">Total de Pedidos</div>
            <div className="text-3xl font-bold">{ordenes.length}</div>
          </div>
          <div className="card">
            <div className="text-gray-600 text-sm">Total Gastado</div>
            <div className="text-3xl font-bold">
              {formatCurrency(ordenes.reduce((sum, o) => sum + o.total, 0))}
            </div>
          </div>
          <div className="card">
            <div className="text-gray-600 text-sm">Pedidos Pendientes</div>
            <div className="text-3xl font-bold">
              {ordenes.filter(o => o.estado === 'pendiente').length}
            </div>
          </div>
        </div>

        {/* Historial Órdenes */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Historial de Pedidos</h2>
          {ordenes.length === 0 ? (
            <p className="text-gray-600">No tienes pedidos aún. <Link href="/vendedor/clientes" className="text-neo-orange font-bold">Crear tu primer pedido</Link></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Número</th>
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-left">Estado</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map(orden => (
                    <tr key={orden.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-bold">{orden.numero_orden}</td>
                      <td className="p-2">{new Date(orden.created_at).toLocaleDateString()}</td>
                      <td className="p-2">
                        <span className={`px-3 py-1 rounded text-xs font-bold ${
                          orden.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          orden.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                          orden.estado === 'entregada' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {orden.estado}
                        </span>
                      </td>
                      <td className="p-2 text-right font-bold">{formatCurrency(orden.total)}</td>
                      <td className="p-2 text-center whitespace-nowrap">
                        <Link href={`/vendedor/orden/${orden.id}`} className="text-neo-orange font-bold hover:underline mr-3">
                          Ver
                        </Link>
                        {orden.estado === 'pendiente' && (
                          <Link href={`/vendedor/orden/${orden.id}/editar`} className="text-blue-600 font-bold hover:underline">
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
