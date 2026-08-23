'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency } from '@/lib/auth'

interface OrderItem {
  id: string
  product_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  products?: {
    nombre: string
    codigo?: string
  }
}

interface Order {
  id: string
  numero_orden: string
  estado: string
  total: number
  datos_comprador: any
  created_at: string
  order_items: OrderItem[]
  vendors?: {
    empresa: string
  }
}

export default function DetalleOrden({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const remitRef = useRef<HTMLDivElement>(null)
  const esNuevo = searchParams.get('new') === 'true'
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    // Desempaquetar params (que es una Promise en Next.js 15)
    params.then(p => setOrderId(p.id))
  }, [params])

  useEffect(() => {
    if (!orderId) return

    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }

    cargarOrden()
  }, [router, orderId])

  async function cargarOrden() {
    if (!orderId) return
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(nombre, codigo))')
      .eq('id', orderId)
      .single()

    if (error || !data) {
      console.error('Error cargando orden:', error)
    } else {
      setOrder(data)
    }
    setLoading(false)
  }

  function imprimirRemito() {
    if (remitRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800')
      if (printWindow) {
        printWindow.document.write('<html><head><title>Remito</title>')
        printWindow.document.write(`<style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .remito { max-width: 600px; margin: 0 auto; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
          .total { font-weight: bold; font-size: 18px; }
          .footer { text-align: center; font-size: 12px; margin-top: 20px; }
        </style></head><body>`)
        printWindow.document.write(remitRef.current.innerHTML)
        printWindow.document.write('</body></html>')
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  function descargarRemito() {
    // Simulación de descarga (en producción usarías jsPDF o similar)
    const texto = generarTextoRemito()
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(texto))
    element.setAttribute('download', `remito_${order?.numero_orden}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  function generarTextoRemito(): string {
    if (!order) return ''
    let texto = `REMITO PROVISIONAL\n`
    texto += `=${'='.repeat(50)}\n\n`
    texto += `Número: ${order.numero_orden}\n`
    texto += `Fecha: ${new Date(order.created_at).toLocaleDateString()}\n`
    texto += `Estado: ${order.estado.toUpperCase()}\n\n`

    texto += `COMPRADOR:\n`
    texto += `Nombre: ${order.datos_comprador.nombre}\n`
    texto += `Empresa: ${order.datos_comprador.empresa}\n`
    texto += `Dirección: ${order.datos_comprador.direccion}\n`
    texto += `Ciudad: ${order.datos_comprador.ciudad}\n`
    texto += `Teléfono: ${order.datos_comprador.telefono}\n\n`

    texto += `PRODUCTOS:\n`
    texto += `-`.repeat(50) + '\n'
    order.order_items?.forEach((item, idx) => {
      texto += `${idx + 1}. ${item.products?.nombre || 'Producto'}\n`
      texto += `   Cantidad: ${item.cantidad} x ${formatCurrency(item.precio_unitario)}\n`
      texto += `   Subtotal: ${formatCurrency(item.subtotal)}\n\n`
    })

    texto += `-`.repeat(50) + '\n'
    texto += `TOTAL: ${formatCurrency(order.total)}\n\n`
    texto += `Envío: GRATIS\n`
    texto += `Compra mínima: $40.000\n`

    return texto
  }

  if (loading) return <div className="text-center py-20">Cargando...</div>
  if (!order) return <div className="text-center py-20">Orden no encontrada</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-neo-orange text-white py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/vendedor/dashboard" className="font-bold text-lg">← NEO MERCADO</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {esNuevo && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            ✓ Pedido creado exitosamente. Número de orden: <b>{order.numero_orden}</b>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Remito Provisional</h1>
          <div className="flex gap-3">
            <button onClick={imprimirRemito} className="btn-secondary">
              🖨️ Imprimir
            </button>
            <button onClick={descargarRemito} className="btn-primary">
              ⬇️ Descargar
            </button>
          </div>
        </div>

        {/* Remito */}
        <div className="card p-8" ref={remitRef}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black">NEO MERCADO</h2>
            <p className="text-sm">REMITO PROVISIONAL</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
            <div>
              <p className="text-xs text-gray-600">Número de Orden</p>
              <p className="text-lg font-bold">{order.numero_orden}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Fecha</p>
              <p className="text-lg font-bold">{new Date(order.created_at).toLocaleDateString('es-AR')}</p>
            </div>
          </div>

          <div className="mb-6 pb-6 border-b">
            <h3 className="font-bold mb-2">DATOS DEL COMPRADOR</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-600">Nombre</p>
                <p className="font-bold">{order.datos_comprador.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Empresa</p>
                <p className="font-bold">{order.datos_comprador.empresa}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Dirección</p>
                <p className="font-bold">{order.datos_comprador.direccion}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Ciudad</p>
                <p className="font-bold">{order.datos_comprador.ciudad}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Teléfono</p>
                <p className="font-bold">{order.datos_comprador.telefono}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">PRODUCTOS</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-2">Producto</th>
                  <th className="text-center py-2">Cantidad</th>
                  <th className="text-right py-2">P. Unitario</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{item.products?.nombre || 'Producto'}</td>
                    <td className="text-center">{item.cantidad}</td>
                    <td className="text-right">{formatCurrency(item.precio_unitario)}</td>
                    <td className="text-right font-bold">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-neo-light p-4 rounded mb-6">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Envío:</span>
              <span className="text-green-600 font-bold">Gratis</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-600">
            <p>Este es un remito provisional de confirmación.</p>
            <p>El remito oficial se entregará con el envío.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/vendedor/dashboard" className="btn-secondary flex-1 text-center">
            ← Volver al Dashboard
          </Link>
          <Link href="/vendedor/catalogo" className="btn-primary flex-1 text-center">
            Hacer otro pedido
          </Link>
        </div>
      </div>
    </div>
  )
}
