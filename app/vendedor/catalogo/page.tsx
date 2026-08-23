'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency } from '@/lib/auth'

interface Product {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  codigo: string | null
  precio_unitario: number
  precio_bulto: number
  factor_bulto: number
  precio_min: number
  precio_max: number
  stock: number
  imagen_base64: string
  permite_ajuste_precio: boolean
}

interface CartItem {
  product: Product
  cantidad: number
  precio: number
}

export default function CatalogoVendedor() {
  const router = useRouter()
  const [productos, setProductos] = useState<Product[]>([])
  const [carrito, setCarrito] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }

    cargarProductos()
    cargarCarrito()
  }, [router])

  async function cargarProductos() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('categoria')

    if (data) {
      setProductos(data)
    }
    setLoading(false)
  }

  function cargarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito_vendedor')
    if (carritoGuardado) {
      setCarrito(JSON.parse(carritoGuardado))
    }
  }

  function guardarCarrito(nuevoCarrito: CartItem[]) {
    setCarrito(nuevoCarrito)
    localStorage.setItem('carrito_vendedor', JSON.stringify(nuevoCarrito))
  }

  function agregarAlCarrito(producto: Product, cantidad: number, precioCustom?: number) {
    if (cantidad <= 0) return

    const precio = precioCustom || producto.precio_unitario
    const existe = carrito.findIndex(item => item.product.id === producto.id && item.precio === precio)

    let nuevoCarrito: CartItem[]
    if (existe >= 0) {
      nuevoCarrito = [...carrito]
      nuevoCarrito[existe].cantidad += cantidad
    } else {
      nuevoCarrito = [...carrito, { product: producto, cantidad, precio }]
    }
    guardarCarrito(nuevoCarrito)
  }

  function eliminarDelCarrito(index: number) {
    const nuevoCarrito = carrito.filter((_, i) => i !== index)
    guardarCarrito(nuevoCarrito)
  }

  const categorias = Array.from(new Set(productos.map(p => p.categoria)))
  const productosFiltrados = filtroCategoria
    ? productos.filter(p => p.categoria === filtroCategoria)
    : productos

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  if (loading) return <div className="text-center py-20">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-neo-orange text-white py-4 px-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/vendedor/dashboard" className="font-bold text-lg">← NEO MERCADO</Link>
          <div className="flex gap-3">
            <Link href="/vendedor/carrito" className="relative">
              <button className="btn-secondary relative">
                🛒 Carrito
                {carrito.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {carrito.length}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Filtro Categorías */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroCategoria(null)}
            className={`px-4 py-2 rounded font-bold text-sm ${
              filtroCategoria === null ? 'bg-neo-orange text-white' : 'bg-neo-light'
            }`}
          >
            Todas
          </button>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-4 py-2 rounded font-bold text-sm ${
                filtroCategoria === cat ? 'bg-neo-orange text-white' : 'bg-neo-light'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {productosFiltrados.map(producto => (
            <ProductoCardVendedor
              key={producto.id}
              producto={producto}
              onAgregar={agregarAlCarrito}
            />
          ))}
        </div>
      </div>

      {/* Resumen Carrito */}
      {carrito.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total: <b className="text-2xl text-neo-dark">{formatCurrency(total)}</b>
            </div>
            <Link href="/vendedor/carrito" className="btn-primary">
              Ver Carrito y Confirmar
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

interface ProductoCardVendedorProps {
  producto: Product
  onAgregar: (producto: Product, cantidad: number, precio?: number) => void
}

function ProductoCardVendedor({ producto, onAgregar }: ProductoCardVendedorProps) {
  const [cantidad, setCantidad] = useState(0)
  const [precio, setPrecio] = useState(producto.precio_unitario)
  const [mostrarPrecioCustom, setMostrarPrecioCustom] = useState(false)

  const puedeAjustar = producto.permite_ajuste_precio
  // El precio de liquidación (precio_min) es un piso: no se puede vender por debajo.
  const precioInvalido = puedeAjustar && (precio < producto.precio_min || precio > producto.precio_max)

  return (
    <div className="card flex flex-col h-full">
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
      <p className="text-xs text-gray-600 mb-2 flex-1">{producto.descripcion}</p>

      {/* Precio unitario y precio por bulto: siempre visibles */}
      <div className="flex flex-col gap-1 mb-2 text-xs">
        <div className="p-2 rounded bg-gray-100">
          <b>{formatCurrency(producto.precio_unitario)}</b> unitario
        </div>
        <div className="p-2 rounded bg-gray-100">
          <b>{formatCurrency(producto.precio_bulto * producto.factor_bulto)}</b> bulto x{producto.factor_bulto}
        </div>
      </div>

      <div className="mb-3">
        {puedeAjustar ? (
          <div>
            <div className="text-xs font-bold text-neo-orange mb-1">
              Precio especial: {formatCurrency(producto.precio_min)} - {formatCurrency(producto.precio_max)}
            </div>
            {mostrarPrecioCustom ? (
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                min={producto.precio_min}
                max={producto.precio_max}
                className={`input-field text-sm ${precioInvalido ? 'border-red-500 border-2' : ''}`}
              />
            ) : (
              <div className={`p-2 rounded font-bold text-sm ${precioInvalido ? 'bg-red-100 text-red-700' : 'bg-neo-light'}`}>
                {formatCurrency(precio)}
              </div>
            )}
            {precioInvalido && (
              <p className="text-xs text-red-600 font-bold mt-1">
                {precio < producto.precio_min
                  ? `No podés vender por debajo del precio de liquidación (${formatCurrency(producto.precio_min)})`
                  : `El precio no puede superar ${formatCurrency(producto.precio_max)}`}
              </p>
            )}
            <button
              type="button"
              className="text-xs text-neo-orange font-bold mt-1"
              onClick={() => setMostrarPrecioCustom(!mostrarPrecioCustom)}
            >
              {mostrarPrecioCustom ? 'Confirmar' : 'Ajustar precio'}
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button
          className="bg-gray-200 px-3 py-1 rounded text-sm"
          onClick={() => setCantidad(Math.max(0, cantidad - 1))}
        >
          -
        </button>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(0, parseInt(e.target.value) || 0))}
          className="flex-1 text-center border border-gray-300 rounded py-1"
        />
        <button className="bg-gray-200 px-3 py-1 rounded text-sm" onClick={() => setCantidad(cantidad + 1)}>
          +
        </button>
      </div>

      <button
        className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={precioInvalido || cantidad <= 0}
        onClick={() => {
          if (precioInvalido) return
          onAgregar(producto, cantidad, puedeAjustar ? precio : undefined)
          setCantidad(0)
        }}
      >
        Agregar
      </button>
    </div>
  )
}
