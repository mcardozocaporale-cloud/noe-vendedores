'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency, getClienteActivo, ClienteActivo } from '@/lib/auth'

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

const PRODUCTOS_POR_PAGINA = 20

export default function CatalogoVendedor() {
  const router = useRouter()
  const [productos, setProductos] = useState<Product[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [carrito, setCarrito] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const [totalProductos, setTotalProductos] = useState(0)
  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [cliente, setCliente] = useState<ClienteActivo | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }

    const clienteActivo = getClienteActivo()
    if (!clienteActivo) {
      router.push('/vendedor/clientes')
      return
    }
    setCliente(clienteActivo)

    cargarCategorias()
    cargarCarrito()
  }, [router])

  // Debounce: espera a que el usuario deje de tipear para buscar
  useEffect(() => {
    const timeout = setTimeout(() => setBusqueda(busquedaInput.trim()), 350)
    return () => clearTimeout(timeout)
  }, [busquedaInput])

  useEffect(() => {
    const session = getSession()
    if (!session) return
    cargarProductos()
  }, [filtroCategoria, pagina, busqueda])

  useEffect(() => {
    setPagina(1)
  }, [filtroCategoria, busqueda])

  async function cargarCategorias() {
    const { data } = await supabase.from('products').select('categoria').gt('stock', 0)
    if (data) {
      setCategorias(Array.from(new Set(data.map(p => p.categoria))).sort())
    }
  }

  async function cargarProductos() {
    setLoading(true)
    const desde = (pagina - 1) * PRODUCTOS_POR_PAGINA
    const hasta = desde + PRODUCTOS_POR_PAGINA - 1

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .gt('stock', 0)
      .order('categoria')
      .order('nombre')
      .range(desde, hasta)

    if (filtroCategoria) {
      query = query.eq('categoria', filtroCategoria)
    }

    if (busqueda) {
      const texto = busqueda.replace(/,/g, ' ')
      query = query.or(`nombre.ilike.%${texto}%,codigo.ilike.%${texto}%`)
    }

    const { data, count } = await query

    if (data) {
      setProductos(data)
      setTotalProductos(count || 0)
    }
    setLoading(false)
  }

  const totalPaginas = Math.max(1, Math.ceil(totalProductos / PRODUCTOS_POR_PAGINA))

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

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  if (loading && categorias.length === 0) return <div className="text-center py-20">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header + Buscador (fijos arriba) */}
      <div className="sticky top-0 z-40">
        <header className="bg-neo-orange text-white py-4 px-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <Link href="/vendedor/dashboard" className="font-bold text-lg block">← NEO MERCADO</Link>
              {cliente && (
                <span className="text-xs opacity-90">
                  Vendiéndole a: <b>{cliente.nombre} {cliente.apellido}</b>
                  {' · '}
                  <Link href="/vendedor/clientes" className="underline">cambiar</Link>
                </span>
              )}
            </div>
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
        <div className="bg-white border-b border-gray-200 p-3 shadow-sm">
          <div className="max-w-6xl mx-auto flex gap-2 items-center">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar por código o nombre/marca..."
              className="input-field flex-1"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
            />
            {busquedaInput && (
              <button
                className="text-gray-500 font-bold px-2"
                onClick={() => setBusquedaInput('')}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

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
        <div className="mb-3 text-sm text-gray-600">
          {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
          {filtroCategoria ? ` en "${filtroCategoria}"` : ''}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Cargando productos...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {productos.map(producto => (
              <ProductoCardVendedor
                key={producto.id}
                producto={producto}
                onAgregar={agregarAlCarrito}
              />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-3 my-8">
            <button
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={pagina <= 1 || loading}
              onClick={() => { setPagina(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            >
              ← Anterior
            </button>
            <span className="text-sm font-bold">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={pagina >= totalPaginas || loading}
              onClick={() => { setPagina(p => Math.min(totalPaginas, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            >
              Siguiente →
            </button>
          </div>
        )}
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
  const [negociando, setNegociando] = useState(false) // negociar precio es OPCIONAL
  const [precioNegociado, setPrecioNegociado] = useState(producto.precio_min ?? producto.precio_unitario)

  const puedeAjustar = producto.permite_ajuste_precio
  // Precio automático: pasa a "bulto" solo al alcanzar la cantidad del pack (factor_bulto).
  const enModoBulto = cantidad >= producto.factor_bulto
  const precioAutomatico = enModoBulto ? producto.precio_bulto : producto.precio_unitario
  // El precio final es el negociado SOLO si el vendedor activó la negociación; si no, el automático.
  const precioFinal = negociando ? precioNegociado : precioAutomatico
  // El precio de liquidación (precio_min) es un piso: no se puede vender por debajo, solo aplica mientras se negocia.
  const precioInvalido = negociando && (precioNegociado < producto.precio_min || precioNegociado > producto.precio_max)

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

      {/* Precio unitario y precio por bulto: siempre visibles, se resalta el que aplica según cantidad */}
      <div className="flex flex-col gap-1 mb-2 text-xs">
        <div className={`p-2 rounded ${!negociando && !enModoBulto ? 'bg-neo-dark text-white' : 'bg-gray-100'}`}>
          <b>{formatCurrency(producto.precio_unitario)}</b> unitario
        </div>
        <div className={`p-2 rounded ${!negociando && enModoBulto ? 'bg-neo-dark text-white' : 'bg-gray-100'}`}>
          <b>{formatCurrency(producto.precio_bulto)}</b> c/u comprando por bulto x{producto.factor_bulto}
        </div>
        {cantidad > 0 && !negociando && (
          <p className="text-[11px] text-gray-500">
            {enModoBulto
              ? `Precio por bulto aplicado (alcanzaste ${producto.factor_bulto} o más unidades)`
              : `Llegando a ${producto.factor_bulto} unidades pasa a precio por bulto`}
          </p>
        )}
      </div>

      {/* Negociar precio: es OPCIONAL, solo si el producto lo permite */}
      {puedeAjustar && (
        <div className="mb-3 border-t pt-2">
          {!negociando ? (
            <button
              type="button"
              className="text-xs text-neo-orange font-bold"
              onClick={() => {
                setPrecioNegociado(producto.precio_min)
                setNegociando(true)
              }}
            >
              💬 Negociar precio (opcional)
            </button>
          ) : (
            <div>
              <div className="text-xs font-bold text-neo-orange mb-1">
                Precio especial: {formatCurrency(producto.precio_min)} - {formatCurrency(producto.precio_max)}
              </div>
              <input
                type="number"
                value={precioNegociado}
                onChange={(e) => setPrecioNegociado(parseFloat(e.target.value) || 0)}
                min={producto.precio_min}
                max={producto.precio_max}
                className={`input-field text-sm ${precioInvalido ? 'border-red-500 border-2' : ''}`}
              />
              {precioInvalido && (
                <p className="text-xs text-red-600 font-bold mt-1">
                  {precioNegociado < producto.precio_min
                    ? `No podés vender por debajo del precio de liquidación (${formatCurrency(producto.precio_min)})`
                    : `El precio no puede superar ${formatCurrency(producto.precio_max)}`}
                </p>
              )}
              <button
                type="button"
                className="text-xs text-gray-500 font-bold mt-1"
                onClick={() => setNegociando(false)}
              >
                Cancelar negociación
              </button>
            </div>
          )}
        </div>
      )}

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
          onAgregar(producto, cantidad, precioFinal)
          setCantidad(0)
          setNegociando(false)
        }}
      >
        Agregar
      </button>
    </div>
  )
}
