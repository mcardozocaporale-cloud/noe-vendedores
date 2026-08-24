'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency } from '@/lib/auth'

interface LineItem {
  id: string | null // null = todavía no existe en order_items (recién agregado)
  product_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  eliminado?: boolean
}

interface ProductoBusqueda {
  id: string
  nombre: string
  precio_unitario: number
  stock: number
}

export default function EditarOrden({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [numeroOrden, setNumeroOrden] = useState('')
  const [items, setItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [puedeEditar, setPuedeEditar] = useState(true)

  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([])

  useEffect(() => {
    params.then(p => setOrderId(p.id))
  }, [params])

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }
    if (orderId) cargarOrden()
  }, [orderId])

  useEffect(() => {
    if (!busqueda.trim()) {
      setResultados([])
      return
    }
    const timeout = setTimeout(buscarProductos, 300)
    return () => clearTimeout(timeout)
  }, [busqueda])

  async function cargarOrden() {
    const { data, error: err } = await supabase
      .from('orders')
      .select('id, numero_orden, estado, order_items(id, product_id, cantidad, precio_unitario, products(nombre))')
      .eq('id', orderId)
      .single()

    if (err || !data) {
      setError('No se pudo cargar el pedido.')
      setLoading(false)
      return
    }

    if (data.estado !== 'pendiente') {
      setPuedeEditar(false)
      setLoading(false)
      return
    }

    setNumeroOrden(data.numero_orden)
    setItems(
      (data.order_items || []).map((it: any) => ({
        id: it.id,
        product_id: it.product_id,
        nombre: it.products?.nombre || 'Producto',
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
      }))
    )
    setLoading(false)
  }

  async function buscarProductos() {
    const texto = busqueda.trim().replace(/,/g, ' ')
    const { data } = await supabase
      .from('products')
      .select('id, nombre, precio_unitario, stock')
      .gt('stock', 0)
      .or(`nombre.ilike.%${texto}%,codigo.ilike.%${texto}%`)
      .limit(8)

    setResultados(data || [])
  }

  function agregarProducto(p: ProductoBusqueda) {
    const existente = items.findIndex(it => it.product_id === p.id && !it.eliminado)
    if (existente >= 0) {
      const nuevos = [...items]
      nuevos[existente].cantidad += 1
      setItems(nuevos)
    } else {
      setItems([...items, { id: null, product_id: p.id, nombre: p.nombre, cantidad: 1, precio_unitario: p.precio_unitario }])
    }
    setBusqueda('')
    setResultados([])
  }

  function cambiarCantidad(index: number, cantidad: number) {
    const nuevos = [...items]
    if (cantidad <= 0) {
      nuevos[index].eliminado = true
    } else {
      nuevos[index].cantidad = cantidad
      nuevos[index].eliminado = false
    }
    setItems(nuevos)
  }

  function quitarItem(index: number) {
    const nuevos = [...items]
    nuevos[index].eliminado = true
    setItems(nuevos)
  }

  const itemsActivos = items.filter(it => !it.eliminado)
  const total = itemsActivos.reduce((sum, it) => sum + it.precio_unitario * it.cantidad, 0)

  async function guardarCambios() {
    if (!orderId) return
    if (itemsActivos.length === 0) {
      setError('El pedido no puede quedar sin productos. Si querés cancelarlo, hacelo desde "Ver pedido".')
      return
    }

    setGuardando(true)
    setError('')

    try {
      // Borrar los que se sacaron (tenían id existente)
      const paraBorrar = items.filter(it => it.eliminado && it.id)
      for (const it of paraBorrar) {
        await supabase.from('order_items').delete().eq('id', it.id)
      }

      // Actualizar los que cambiaron de cantidad
      const paraActualizar = itemsActivos.filter(it => it.id)
      for (const it of paraActualizar) {
        await supabase
          .from('order_items')
          .update({ cantidad: it.cantidad, subtotal: it.cantidad * it.precio_unitario })
          .eq('id', it.id)
      }

      // Insertar los nuevos
      const paraInsertar = itemsActivos.filter(it => !it.id)
      if (paraInsertar.length > 0) {
        await supabase.from('order_items').insert(
          paraInsertar.map(it => ({
            order_id: orderId,
            product_id: it.product_id,
            cantidad: it.cantidad,
            precio_unitario: it.precio_unitario,
            subtotal: it.cantidad * it.precio_unitario,
          }))
        )
      }

      // Actualizar el total del pedido
      await supabase.from('orders').update({ total }).eq('id', orderId)

      router.push(`/vendedor/orden/${orderId}`)
    } catch (err) {
      setError('Error al guardar los cambios. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  if (loading) return <div className="text-center py-20">Cargando...</div>

  if (!puedeEditar) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Este pedido ya no se puede editar (no está pendiente).</p>
          <Link href={`/vendedor/orden/${orderId}`} className="btn-primary">Ver pedido</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-neo-orange text-white py-4 px-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link href="/vendedor/dashboard" className="font-bold text-lg">← NEO MERCADO</Link>
          <span className="text-sm font-bold">Editando {numeroOrden}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Editar pedido</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Buscador para agregar productos */}
        <div className="card mb-6">
          <label className="block text-sm font-bold mb-2">+ Agregar producto</label>
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            className="input-field"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {resultados.length > 0 && (
            <div className="mt-2 space-y-1">
              {resultados.map(p => (
                <button
                  key={p.id}
                  onClick={() => agregarProducto(p)}
                  className="w-full text-left p-2 rounded hover:bg-neo-light flex justify-between items-center text-sm"
                >
                  <span>{p.nombre}</span>
                  <span className="text-neo-orange font-bold">{formatCurrency(p.precio_unitario)} +</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items actuales */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold mb-4">Productos ({itemsActivos.length})</h2>
          {itemsActivos.length === 0 && <p className="text-gray-500">No hay productos. Agregá alguno arriba.</p>}
          <div className="space-y-3">
            {items.map((item, idx) => {
              if (item.eliminado) return null
              return (
                <div key={idx} className="flex items-center gap-3 border-b pb-3">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.nombre}</p>
                    <p className="text-xs text-gray-600">{formatCurrency(item.precio_unitario)} c/u</p>
                  </div>
                  <button
                    className="bg-gray-200 w-7 h-7 rounded"
                    onClick={() => cambiarCantidad(idx, item.cantidad - 1)}
                  >-</button>
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={e => cambiarCantidad(idx, Math.min(9999, parseInt(e.target.value) || 0))}
                    className="w-14 text-center border border-gray-300 rounded py-1"
                  />
                  <button
                    className="bg-gray-200 w-7 h-7 rounded"
                    onClick={() => cambiarCantidad(idx, item.cantidad + 1)}
                  >+</button>
                  <span className="w-24 text-right font-bold text-sm">
                    {formatCurrency(item.precio_unitario * item.cantidad)}
                  </span>
                  <button onClick={() => quitarItem(idx)} className="text-red-600 font-bold px-1">✕</button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card sticky bottom-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold">Total</span>
            <span className="text-2xl font-black">{formatCurrency(total)}</span>
          </div>
          <div className="flex gap-3">
            <Link href="/vendedor/dashboard" className="btn-secondary flex-1 text-center">
              Cancelar
            </Link>
            <button onClick={guardarCambios} disabled={guardando} className="btn-primary flex-1">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
