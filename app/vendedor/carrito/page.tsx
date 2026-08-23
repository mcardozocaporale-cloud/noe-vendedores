'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency, generateOrderNumber } from '@/lib/auth'

interface Product {
  id: string
  nombre: string
}

interface ProductPriceCheck {
  id: string
  precio_min: number | null
  precio_max: number | null
  precio_unitario: number
  precio_bulto: number
  permite_ajuste_precio: boolean
}

interface CartItem {
  product: Product
  cantidad: number
  precio: number
}

interface DatosComprador {
  nombre: string
  empresa: string
  telefono: string
  direccion: string
  ciudad: string
}

export default function CarritoVendedor() {
  const router = useRouter()
  const [carrito, setCarrito] = useState<CartItem[]>([])
  const [vendor, setVendor] = useState<any>(null)
  const [datosComprador, setDatosComprador] = useState<DatosComprador>({
    nombre: '',
    empresa: '',
    telefono: '',
    direccion: '',
    ciudad: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }

    cargarDatos(session.vendorId)
    cargarCarrito()
  }, [router])

  async function cargarDatos(vendorId: string) {
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single()

    if (data) {
      setVendor(data)
      setDatosComprador({
        nombre: data.nombre || '',
        empresa: data.empresa || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        ciudad: '',
      })
    }
  }

  function cargarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito_vendedor')
    if (carritoGuardado) {
      setCarrito(JSON.parse(carritoGuardado))
    }
  }

  function actualizarCarrito(nuevoCarrito: CartItem[]) {
    setCarrito(nuevoCarrito)
    localStorage.setItem('carrito_vendedor', JSON.stringify(nuevoCarrito))
  }

  function eliminarDelCarrito(index: number) {
    const nuevoCarrito = carrito.filter((_, i) => i !== index)
    actualizarCarrito(nuevoCarrito)
  }

  function actualizarCantidad(index: number, nuevaCantidad: number) {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(index)
      return
    }
    const nuevoCarrito = [...carrito]
    nuevoCarrito[index].cantidad = nuevaCantidad
    actualizarCarrito(nuevoCarrito)
  }

  async function confirmarPedido() {
    if (!vendor || carrito.length === 0) {
      setError('Carrito vacío o vendedor no identificado')
      return
    }

    if (!datosComprador.nombre || !datosComprador.empresa) {
      setError('Completa nombre y empresa del comprador')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Re-validar precios contra la base de datos ANTES de confirmar.
      // El precio de liquidación (precio_min) es un piso: no se puede vender por debajo,
      // sin importar lo que haya quedado guardado en el carrito local.
      const productIds = carrito.map(item => item.product.id)
      const { data: productosActuales, error: precioError } = await supabase
        .from('products')
        .select('id, precio_min, precio_max, precio_unitario, precio_bulto, permite_ajuste_precio')
        .in('id', productIds)

      if (precioError || !productosActuales) {
        throw new Error('No se pudieron validar los precios. Intenta de nuevo.')
      }

      const porId = new Map<string, ProductPriceCheck>(productosActuales.map(p => [p.id, p]))
      const itemsInvalidos: string[] = []

      for (const item of carrito) {
        const actual = porId.get(item.product.id)
        if (!actual || !actual.permite_ajuste_precio) continue

        // Si el precio coincide con el unitario o bulto normal, es venta al precio de lista
        // (no negoció), no corresponde validar contra el rango especial.
        const esPrecioDeLista =
          Math.abs(item.precio - actual.precio_unitario) < 0.01 ||
          Math.abs(item.precio - actual.precio_bulto) < 0.01
        if (esPrecioDeLista) continue

        if (actual.precio_min != null && item.precio < actual.precio_min) {
          itemsInvalidos.push(`${item.product.nombre}: no puede ser menor a ${formatCurrency(actual.precio_min)}`)
        }
        if (actual.precio_max != null && item.precio > actual.precio_max) {
          itemsInvalidos.push(`${item.product.nombre}: no puede superar ${formatCurrency(actual.precio_max)}`)
        }
      }

      if (itemsInvalidos.length > 0) {
        setError(`Hay precios fuera del rango permitido:\n${itemsInvalidos.join('\n')}`)
        setLoading(false)
        return
      }

      const numeroOrden = generateOrderNumber()
      const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

      // Crear orden
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          vendor_id: vendor.id,
          numero_orden: numeroOrden,
          estado: 'pendiente',
          total,
          datos_comprador: datosComprador,
        })
        .select()
        .single()

      if (orderError || !orderData) {
        throw new Error('Error al crear la orden')
      }

      // Agregar items de la orden
      const items = carrito.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items)

      if (itemsError) {
        throw new Error('Error al agregar items a la orden')
      }

      // Limpiar carrito
      localStorage.removeItem('carrito_vendedor')

      // Redirigir a confirmación
      router.push(`/vendedor/orden/${orderData.id}?new=true`)
    } catch (err: any) {
      setError(err.message || 'Error al confirmar pedido')
    } finally {
      setLoading(false)
    }
  }

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  if (!vendor) return <div className="text-center py-20">Cargando...</div>

  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Carrito vacío</p>
          <Link href="/vendedor/catalogo" className="btn-primary">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-neo-orange text-white py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/vendedor/dashboard" className="font-bold text-lg">← NEO MERCADO</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Confirmar Pedido</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Carrito */}
          <div className="md:col-span-2">
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">Productos ({carrito.length})</h2>
              <div className="space-y-4">
                {carrito.map((item, idx) => (
                  <div key={idx} className="flex gap-4 border-b pb-4">
                    <div className="flex-1">
                      <h4 className="font-bold">{item.product.nombre}</h4>
                      <p className="text-sm text-gray-600">{formatCurrency(item.precio)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => actualizarCantidad(idx, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border border-gray-300 rounded py-1"
                      />
                      <span className="text-right w-32 font-bold">
                        {formatCurrency(item.precio * item.cantidad)}
                      </span>
                      <button
                        onClick={() => eliminarDelCarrito(idx)}
                        className="text-red-600 font-bold hover:opacity-70"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Datos Comprador */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Datos del Comprador</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={datosComprador.nombre}
                    onChange={(e) => setDatosComprador({ ...datosComprador, nombre: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Empresa *</label>
                  <input
                    type="text"
                    value={datosComprador.empresa}
                    onChange={(e) => setDatosComprador({ ...datosComprador, empresa: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={datosComprador.telefono}
                    onChange={(e) => setDatosComprador({ ...datosComprador, telefono: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Dirección</label>
                  <input
                    type="text"
                    value={datosComprador.direccion}
                    onChange={(e) => setDatosComprador({ ...datosComprador, direccion: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={datosComprador.ciudad}
                    onChange={(e) => setDatosComprador({ ...datosComprador, ciudad: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="md:col-span-1">
            <div className="card sticky top-20">
              <h3 className="text-lg font-bold mb-4">Resumen</h3>
              <div className="space-y-2 mb-4 pb-4 border-b">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span className="text-green-600 font-bold">Gratis</span>
                </div>
              </div>
              <div className="text-2xl font-black mb-6">
                Total: {formatCurrency(total)}
              </div>
              <button
                onClick={confirmarPedido}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Enviando...' : 'Confirmar Pedido'}
              </button>
              <Link href="/vendedor/catalogo" className="btn-secondary w-full mt-2 text-center block">
                Seguir Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
