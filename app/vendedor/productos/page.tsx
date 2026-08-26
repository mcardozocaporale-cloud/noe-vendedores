'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, formatCurrency } from '@/lib/auth'
import { comprimirImagen } from '@/lib/imageUtils'

interface Producto {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  codigo: string | null
  precio_unitario: number
  precio_bulto: number
  factor_bulto: number
  precio_min: number | null
  stock: number
  activo: boolean
  imagen_base64: string | null
}

interface FormEdicion {
  nombre: string
  categoria: string
  codigo: string
  precio_unitario: string
  precio_bulto: string
  factor_bulto: string
  precio_min: string
  stock: string
  activo: boolean
}

const ADMIN_EMAIL = 'admin@neomercado.com'
const POR_PAGINA = 20

function productoAForm(p: Producto): FormEdicion {
  return {
    nombre: p.nombre,
    categoria: p.categoria,
    codigo: p.codigo || '',
    precio_unitario: String(p.precio_unitario ?? ''),
    precio_bulto: String(p.precio_bulto ?? ''),
    factor_bulto: String(p.factor_bulto ?? ''),
    precio_min: p.precio_min != null ? String(p.precio_min) : '',
    stock: String(p.stock ?? ''),
    activo: p.activo,
  }
}

const FORM_VACIO: FormEdicion = {
  nombre: '',
  categoria: '',
  codigo: '',
  precio_unitario: '',
  precio_bulto: '',
  factor_bulto: '1',
  precio_min: '',
  stock: '0',
  activo: true,
}

export default function ProductosAdmin() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState<boolean | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalProductos, setTotalProductos] = useState(0)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormEdicion>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [subiendoFoto, setSubiendoFoto] = useState(false)

  const [creando, setCreando] = useState(false)
  const [formNuevo, setFormNuevo] = useState<FormEdicion>(FORM_VACIO)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }
    setAutorizado(session.email === ADMIN_EMAIL)
  }, [router])

  useEffect(() => {
    if (autorizado) cargarCategorias()
  }, [autorizado])

  useEffect(() => {
    const timeout = setTimeout(() => setBusqueda(busquedaInput.trim()), 350)
    return () => clearTimeout(timeout)
  }, [busquedaInput])

  useEffect(() => {
    if (autorizado) cargarProductos()
  }, [autorizado, busqueda, filtroCategoria, pagina])

  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtroCategoria])

  async function cargarCategorias() {
    const { data } = await supabase.from('products').select('categoria')
    if (data) setCategorias(Array.from(new Set(data.map(p => p.categoria))).sort())
  }

  async function cargarProductos() {
    setLoading(true)
    const desde = (pagina - 1) * POR_PAGINA
    const hasta = desde + POR_PAGINA - 1

    let query = supabase
      .from('products')
      .select('id, nombre, descripcion, categoria, codigo, precio_unitario, precio_bulto, factor_bulto, precio_min, stock, activo, imagen_base64', { count: 'exact' })
      .order('categoria')
      .order('nombre')
      .range(desde, hasta)

    if (filtroCategoria) query = query.eq('categoria', filtroCategoria)
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

  const totalPaginas = Math.max(1, Math.ceil(totalProductos / POR_PAGINA))

  function abrirEdicion(p: Producto) {
    setEditandoId(p.id)
    setForm(productoAForm(p))
    setError('')
  }

  function cerrarEdicion() {
    setEditandoId(null)
    setError('')
  }

  async function guardarEdicion(id: string) {
    setGuardando(true)
    setError('')
    try {
      const payload = {
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim(),
        codigo: form.codigo.trim() || null,
        precio_unitario: parseFloat(form.precio_unitario) || 0,
        precio_bulto: parseFloat(form.precio_bulto) || 0,
        factor_bulto: parseInt(form.factor_bulto) || 1,
        precio_min: form.precio_min.trim() ? parseFloat(form.precio_min) : null,
        stock: parseInt(form.stock) || 0,
        activo: form.activo,
      }
      const res = await fetch(`/api/producto/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar.')

      setProductos(prev => prev.map(p => (p.id === id ? { ...p, ...payload } : p)))
      setEditandoId(null)
    } catch (err: any) {
      setError(err.message || 'Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  async function subirFoto(id: string, file: File) {
    setSubiendoFoto(true)
    setError('')
    try {
      const imagen_base64 = await comprimirImagen(file)
      const res = await fetch('/api/producto-imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, imagen_base64 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir la foto.')
      setProductos(prev => prev.map(p => (p.id === id ? { ...p, imagen_base64 } : p)))
    } catch (err: any) {
      setError(err.message || 'Error al subir la foto.')
    } finally {
      setSubiendoFoto(false)
    }
  }

  async function crearProducto(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const payload = {
        nombre: formNuevo.nombre.trim(),
        categoria: formNuevo.categoria.trim(),
        codigo: formNuevo.codigo.trim() || null,
        precio_unitario: parseFloat(formNuevo.precio_unitario) || 0,
        precio_bulto: parseFloat(formNuevo.precio_bulto) || parseFloat(formNuevo.precio_unitario) || 0,
        factor_bulto: parseInt(formNuevo.factor_bulto) || 1,
        precio_min: formNuevo.precio_min.trim() ? parseFloat(formNuevo.precio_min) : null,
        stock: parseInt(formNuevo.stock) || 0,
        activo: formNuevo.activo,
      }
      if (!payload.nombre || !payload.categoria || !payload.precio_unitario) {
        throw new Error('Nombre, categoría y precio unitario son obligatorios.')
      }
      const res = await fetch('/api/producto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear el producto.')

      setCreando(false)
      setFormNuevo(FORM_VACIO)
      cargarCategorias()
      cargarProductos()
    } catch (err: any) {
      setError(err.message || 'Error al crear el producto.')
    } finally {
      setGuardando(false)
    }
  }

  if (autorizado === null) return <div className="text-center py-20">Cargando...</div>

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">No tenés permiso para acceder a esta sección.</p>
          <Link href="/vendedor/dashboard" className="btn-primary">← Volver</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-neo-orange text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/vendedor/dashboard" className="font-bold text-lg">← NEO MERCADO</Link>
          <Link href="/vendedor/importar" className="btn-secondary text-sm">📥 Importar Excel</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-1">Editar productos</h1>
        <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-6 text-sm">
          ⚠️ Precio, stock, nombre, categoría y activo se <b>pisan solos</b> la próxima vez que subas un
          Excel (el Excel siempre manda). Usá esto para arreglos puntuales entre una subida y la
          siguiente, o para productos que no están en el Excel. La <b>foto es la excepción</b>: el
          importador nunca la toca, así que una vez cargada queda para siempre.
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
          <div className="flex gap-2 flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              className="input-field flex-1"
              value={busquedaInput}
              onChange={e => setBusquedaInput(e.target.value)}
            />
            <select
              className="input-field w-48"
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary whitespace-nowrap" onClick={() => { setCreando(v => !v); setFormNuevo(FORM_VACIO) }}>
            {creando ? '✕ Cancelar' : '+ Nuevo producto'}
          </button>
        </div>

        {creando && (
          <form onSubmit={crearProducto} className="card mb-6">
            <h2 className="font-bold mb-3">Nuevo producto</h2>
            <CamposFormulario form={formNuevo} setForm={setFormNuevo} />
            <button type="submit" disabled={guardando} className="btn-primary mt-3">
              {guardando ? 'Creando...' : 'Crear producto'}
            </button>
          </form>
        )}

        <div className="mb-3 text-sm text-gray-600">{totalProductos} productos</div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Cargando...</div>
        ) : (
          <div className="space-y-3 mb-6">
            {productos.map(p => (
              <div key={p.id} className="card">
                {editandoId === p.id ? (
                  <div>
                    <CamposFormulario form={form} setForm={setForm} />
                    <div className="flex gap-2 mt-3">
                      <button
                        className="btn-primary text-sm"
                        disabled={guardando}
                        onClick={() => guardarEdicion(p.id)}
                      >
                        {guardando ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button className="btn-secondary text-sm" onClick={cerrarEdicion}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 flex-shrink-0 border border-gray-200 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                      {p.imagen_base64 ? (
                        <img src={`data:image/png;base64,${p.imagen_base64}`} alt={p.nombre} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-gray-400 text-center px-1">Sin foto</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{p.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {p.categoria} {p.codigo && `· #${p.codigo}`} · {formatCurrency(p.precio_unitario)}
                        {!p.activo && <span className="text-red-600 font-bold"> · INACTIVO</span>}
                      </div>
                    </div>
                    <label className="btn-secondary text-xs cursor-pointer whitespace-nowrap">
                      {subiendoFoto ? '...' : '📷 Foto'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={subiendoFoto}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) subirFoto(p.id, file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <button className="btn-secondary text-xs whitespace-nowrap" onClick={() => abrirEdicion(p)}>
                      ✎ Editar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-3 my-8">
            <button
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={pagina <= 1 || loading}
              onClick={() => { setPagina(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            >
              ← Anterior
            </button>
            <span className="text-sm font-bold">Página {pagina} de {totalPaginas}</span>
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
    </div>
  )
}

function CamposFormulario({ form, setForm }: { form: FormEdicion; setForm: (f: FormEdicion) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="col-span-2">
        <label className="block font-bold mb-1">Nombre</label>
        <input className="input-field" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
      </div>
      <div>
        <label className="block font-bold mb-1">Categoría</label>
        <input className="input-field" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} />
      </div>
      <div>
        <label className="block font-bold mb-1">Código</label>
        <input className="input-field" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} />
      </div>
      <div>
        <label className="block font-bold mb-1">Precio unitario</label>
        <input type="number" className="input-field" value={form.precio_unitario} onChange={e => setForm({ ...form, precio_unitario: e.target.value })} />
      </div>
      <div>
        <label className="block font-bold mb-1">Precio por bulto</label>
        <input type="number" className="input-field" value={form.precio_bulto} onChange={e => setForm({ ...form, precio_bulto: e.target.value })} />
      </div>
      <div>
        <label className="block font-bold mb-1">Pack (unidades x bulto)</label>
        <input type="number" className="input-field" value={form.factor_bulto} onChange={e => setForm({ ...form, factor_bulto: e.target.value })} />
      </div>
      <div>
        <label className="block font-bold mb-1">Precio Liq (piso negociación)</label>
        <input type="number" className="input-field" value={form.precio_min} onChange={e => setForm({ ...form, precio_min: e.target.value })} />
      </div>
      <div>
        <label className="block font-bold mb-1">Stock (informativo)</label>
        <input type="number" className="input-field" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
      </div>
      <div className="flex items-center gap-2 mt-5">
        <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
        <label htmlFor="activo" className="font-bold">Activo (visible en la web)</label>
      </div>
    </div>
  )
}
