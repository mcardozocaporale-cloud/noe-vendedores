'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/auth'

interface Product {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  codigo: string | null
  precio_unitario: number
  precio_bulto: number
  factor_bulto: number
  stock: number
  imagen_base64: string
}

interface CartItem {
  product: Product
  cantidad: number
  precio: number
  modo: 'unitario' | 'bulto'
}

export default function CatalogPublico() {
  const [productos, setProductos] = useState<Product[]>([])
  const [carrito, setCarrito] = useState<CartItem[]>([])
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', direccion: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('categoria')

    if (error) {
      console.error('Error cargando productos:', error)
    } else {
      setProductos(data || [])
    }
    setLoading(false)
  }

  function agregarAlCarrito(producto: Product, cantidad: number, modo: 'unitario' | 'bulto') {
    if (cantidad <= 0) return

    const precio = modo === 'bulto' ? producto.precio_bulto * producto.factor_bulto : producto.precio_unitario
    const existe = carrito.findIndex(item => item.product.id === producto.id && item.modo === modo)

    if (existe >= 0) {
      const nuevoCarrito = [...carrito]
      nuevoCarrito[existe].cantidad += cantidad
      setCarrito(nuevoCarrito)
    } else {
      setCarrito([...carrito, { product: producto, cantidad, precio, modo }])
    }
  }

  function eliminarDelCarrito(index: number) {
    setCarrito(carrito.filter((_, i) => i !== index))
  }

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  function generarMensajeWhatsApp() {
    if (!cliente.nombre || carrito.length === 0) return ''

    let mensaje = `Pedido de: ${cliente.nombre}\n`
    if (cliente.direccion) mensaje += `Dirección: ${cliente.direccion}\n`
    if (cliente.telefono) mensaje += `Teléfono: ${cliente.telefono}\n`
    mensaje += `\n`

    carrito.forEach((item, idx) => {
      const descripcion = item.modo === 'bulto'
        ? `${item.cantidad} bulto(s) x${item.product.factor_bulto} de ${item.product.nombre}`
        : `${item.cantidad}x ${item.product.nombre}`
      mensaje += `${idx + 1}. ${descripcion} - ${formatCurrency(item.precio * item.cantidad)}\n`
    })

    mensaje += `\nProductos distintos: ${carrito.length}\n`
    mensaje += `TOTAL: ${formatCurrency(total)}`

    return mensaje
  }

  const urlWhatsApp = `https://wa.me/5492494219951?text=${encodeURIComponent(generarMensajeWhatsApp())}`

  if (loading) return <div className="text-center py-20">Cargando catálogo...</div>

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-neo-orange to-orange-600 text-white py-6 px-4 text-center">
        <h1 className="text-3xl font-black">NEO MERCADO</h1>
        <p className="text-sm opacity-90">Catálogo de pedidos - Público</p>
        <Link href="/vendedor/login" className="text-sm mt-2 inline-block hover:underline">
          ¿Eres vendedor? Accede aquí
        </Link>
      </header>

      {/* Info Banner */}
      <div className="bg-orange-50 border-l-4 border-neo-orange m-4 p-3 rounded text-sm text-gray-700">
        Catálogo público. Compra mínima $40.000. Envío sin cargo. Exclusivo para comercios y eventos.
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-32">
        {/* Datos Cliente */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h2 className="font-bold mb-3">Tus datos</h2>
          <input
            type="text"
            placeholder="Tu nombre o negocio"
            className="input-field mb-3"
            value={cliente.nombre}
            onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
          />
          <input
            type="text"
            placeholder="Dirección de entrega"
            className="input-field mb-3"
            value={cliente.direccion}
            onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Teléfono"
            className="input-field"
            value={cliente.telefono}
            onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
          />
        </div>

        {/* Categorías y Productos */}
        {Array.from(new Set(productos.map(p => p.categoria))).map(categoria => (
          <div key={categoria} className="mb-8">
            <h3 className="text-xl font-bold border-b-2 border-neo-dark mb-4">
              {categoria} <span className="text-xs text-gray-500">({productos.filter(p => p.categoria === categoria).length})</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {productos.filter(p => p.categoria === categoria).map(producto => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  onAgregar={agregarAlCarrito}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Resumen Reparto */}
        <div className="bg-neo-light border border-gray-300 rounded-lg p-6 text-center my-8">
          <h2 className="text-2xl font-bold mb-4">Reparto</h2>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="bg-neo-orange text-white">
                <th className="p-2">Recepción</th>
                <th className="p-2">Entrega</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Lunes mediodía', 'Miércoles'],
                ['Martes mediodía', 'Jueves'],
                ['Miércoles mediodía', 'Viernes'],
                ['Jueves mediodía', 'Sábado'],
                ['Viernes mediodía', 'Lunes'],
                ['Sábado mediodía', 'Martes'],
              ].map(([recepcion, entrega], idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{recepcion}</td>
                  <td className="p-2 font-bold">{entrega}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-600 mb-2">Envío sin cargo · Compra mínima $40.000 · Exclusivo para comercios</p>
          <p className="text-lg font-black">¡Gracias por elegirnos!</p>
        </div>
      </div>

      {/* Resumen Carrito (fijo abajo) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Total: <b className="text-2xl text-neo-dark">{formatCurrency(total)}</b>
          </div>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener"
            className={`btn-primary ${!cliente.nombre || carrito.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => {
              if (!cliente.nombre || carrito.length === 0) e.preventDefault()
            }}
          >
            Enviar pedido por WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

interface ProductoCardProps {
  producto: Product
  onAgregar: (producto: Product, cantidad: number, modo: 'unitario' | 'bulto') => void
}

function ProductoCard({ producto, onAgregar }: ProductoCardProps) {
  const [cantidad, setCantidad] = useState(0)
  // El precio pasa a "bulto" automáticamente al alcanzar la cantidad del pack (factor_bulto).
  const modo: 'unitario' | 'bulto' = cantidad >= producto.factor_bulto ? 'bulto' : 'unitario'

  return (
    <div className="card flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div className="bg-purple-100 text-xs font-bold px-2 py-1 rounded w-fit">
          Bulto x{producto.factor_bulto}
        </div>
        {producto.codigo && (
          <div className="text-[10px] text-gray-400 font-mono">#{producto.codigo}</div>
        )}
      </div>
      {producto.imagen_base64 && (
        <img
          src={`data:image/png;base64,${producto.imagen_base64}`}
          alt={producto.nombre}
          className="w-full aspect-square object-contain mb-3 border border-gray-200 rounded"
        />
      )}
      <h4 className="font-bold text-sm mb-1">{producto.nombre}</h4>
      <p className="text-xs text-gray-600 mb-2">{producto.descripcion}</p>

      <div className="flex flex-col gap-2 mb-3 text-xs">
        <div className={`p-2 rounded ${modo === 'unitario' ? 'bg-neo-dark text-white' : 'bg-gray-100'}`}>
          <b>{formatCurrency(producto.precio_unitario)}</b> unitario
        </div>
        <div className={`p-2 rounded ${modo === 'bulto' ? 'bg-neo-dark text-white' : 'bg-gray-100'}`}>
          <b>{formatCurrency(producto.precio_bulto * producto.factor_bulto)}</b> bulto x{producto.factor_bulto}
        </div>
        {cantidad > 0 && (
          <p className="text-[11px] text-gray-500">
            {modo === 'bulto'
              ? `Precio por bulto aplicado (alcanzaste ${producto.factor_bulto} o más unidades)`
              : `Llegando a ${producto.factor_bulto} unidades pasa a precio por bulto`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => setCantidad(Math.max(0, cantidad - 1))}>
          -
        </button>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(0, parseInt(e.target.value) || 0))}
          className="flex-1 text-center border border-gray-300 rounded py-1"
        />
        <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => setCantidad(cantidad + 1)}>
          +
        </button>
      </div>

      <button
        className="btn-primary text-xs"
        onClick={() => {
          onAgregar(producto, cantidad, modo)
          setCantidad(0)
        }}
      >
        Agregar al carrito
      </button>
    </div>
  )
}
