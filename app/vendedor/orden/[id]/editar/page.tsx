'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency, nombreConVariedad } from '@/lib/auth'
import { IconX } from '@/lib/icons'

interface LineItem {
  id: string | null // null = todavía no existe en order_items (recién agregado)
  product_id: string
  nombre: string
  cantidad: number
  precio_unitario: number // precio actual, editable
  precio_lista: number // techo de negociación = precio de lista del producto
  precio_min: number | null // piso = Precio Liq del Excel
  precio_bulto: number // respaldo de piso si todavía no hay Precio Liq cargado
  eliminado?: boolean
}

interface ProductoBusqueda {
  id: string
  nombre: string
  descripcion?: string
  precio_unitario: number
  precio_bulto: number
  precio_min: number | null
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
      .select('id, numero_orden, estado, order_items(id, product_id, cantidad, precio_unitario, products(nombre, descripcion, precio_unitario, precio_bulto, precio_min))')
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
        nombre: it.products ? nombreConVariedad(it.products.nombre, it.products.descripcion) : 'Producto',
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        // El techo de negociación es el precio de lista ACTUAL del producto, no el precio con el
        // que se cargó el pedido (que ya puede ser uno negociado más bajo).
        precio_lista: it.products?.precio_unitario ?? it.precio_unitario,
        precio_min: it.products?.precio_min ?? null,
        precio_bulto: it.products?.precio_bulto ?? it.precio_unitario,
      }))
    )
    setLoading(false)
  }

  async function buscarProductos() {
    const texto = busqueda.trim().replace(/,/g, ' ')
    const { data } = await supabase
      .from('products')
      .select('id, nombre, descripcion, precio_unitario, precio_bulto, precio_min, stock')
      .eq('activo', true)
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
      const nombre = nombreConVariedad(p.nombre, p.descripcion)
      setItems([...items, {
        id: null,
        product_id: p.id,
        nombre,
        cantidad: 1,
        precio_unitario: p.precio_unitario,
        precio_lista: p.precio_unitario,
        precio_min: p.precio_min,
        precio_bulto: p.precio_bulto,
      }])
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

  function cambiarPrecio(index: number, precio: number) {
    const nuevos = [...items]
    nuevos[index].precio_unitario = precio
    setItems(nuevos)
  }

  function rangoDe(item: LineItem) {
    return { min: item.precio_min ?? item.precio_bulto, max: item.precio_lista }
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

    const fueraDeRango = itemsActivos.filter(it => {
      const { min, max } = rangoDe(it)
      return it.precio_unitario < min || it.precio_unitario > max
    })
    if (fueraDeRango.length > 0) {
      setError(`Hay precios fuera del rango permitido:\n${fueraDeRango.map(it => {
        const { min, max } = rangoDe(it)
        return `${it.nombre}: entre ${formatCurrency(min)} y ${formatCurrency(max)}`
      }).join('\n')}`)
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
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Este pedido ya no se puede editar (no está pendiente).</p>
          <Link href={`/vendedor/orden/${orderId}`} className="btn-primary">Ver pedido</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-sm font-bold text-neo-orange mb-1">Editando {numeroOrden}</p>
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
                  <span>{nombreConVariedad(p.nombre, p.descripcion)}</span>
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
              const { min: rangoMin, max: rangoMax } = rangoDe(item)
              const precioInvalido = item.precio_unitario < rangoMin || item.precio_unitario > rangoMax
              return (
                <div key={idx} className="flex items-center gap-3 border-b pb-3 flex-wrap">
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-bold text-sm">{item.nombre}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-gray-500">$</span>
                      <input
                        type="number"
                        value={item.precio_unitario}
                        onChange={e => cambiarPrecio(idx, parseFloat(e.target.value) || 0)}
                        min={rangoMin}
                        max={rangoMax}
                        className={`w-24 text-sm border rounded py-1 px-1.5 ${precioInvalido ? 'border-red-500 border-2' : 'border-gray-300'}`}
                      />
                      <span className="text-xs text-gray-500">c/u</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${precioInvalido ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                      Rango permitido: {formatCurrency(rangoMin)} - {formatCurrency(rangoMax)}
                    </p>
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
                  <button onClick={() => quitarItem(idx)} className="text-red-600 px-1" aria-label="Quitar producto">
                    <IconX className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card sticky bottom-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold">Total</span>
            <span className="text-xl font-semibold">{formatCurrency(total)}</span>
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
