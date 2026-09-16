'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, setClienteActivo } from '@/lib/auth'
import { IconMapPin, IconPlus } from '@/lib/icons'

interface Cliente {
  id: string
  codigo_cliente: string | null
  nombre: string
  apellido: string
  direccion: string | null
  vendedor_codigo: string | null
  forma_pago: string | null
}

const POR_PAGINA = 25

export default function ListaClientes() {
  const router = useRouter()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vendedores, setVendedores] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }
    setVendorId(session.vendorId)
  }, [router])

  useEffect(() => {
    if (vendorId) cargarVendedores()
  }, [vendorId])

  useEffect(() => {
    const timeout = setTimeout(() => setBusqueda(busquedaInput.trim()), 300)
    return () => clearTimeout(timeout)
  }, [busquedaInput])

  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtroVendedor])

  useEffect(() => {
    if (vendorId) cargarClientes()
  }, [vendorId, busqueda, filtroVendedor, pagina])

  async function cargarVendedores() {
    const { data } = await supabase.from('clientes').select('vendedor_codigo').eq('vendor_id', vendorId)
    if (data) {
      const unicos = Array.from(new Set(data.map(c => c.vendedor_codigo).filter(Boolean))) as string[]
      setVendedores(unicos.sort())
    }
  }

  async function cargarClientes() {
    setLoading(true)
    const desde = (pagina - 1) * POR_PAGINA
    const hasta = desde + POR_PAGINA - 1

    let query = supabase
      .from('clientes')
      .select('id, codigo_cliente, nombre, apellido, direccion, vendedor_codigo, forma_pago', { count: 'exact' })
      .eq('vendor_id', vendorId)
      .order('nombre')
      .range(desde, hasta)

    if (filtroVendedor) query = query.eq('vendedor_codigo', filtroVendedor)
    if (busqueda) {
      const texto = busqueda.replace(/,/g, ' ')
      query = query.or(`nombre.ilike.%${texto}%,codigo_cliente.ilike.%${texto}%,direccion.ilike.%${texto}%`)
    }

    const { data, count } = await query
    if (data) {
      setClientes(data)
      setTotal(count || 0)
    }
    setLoading(false)
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  function usarCliente(c: Cliente) {
    setClienteActivo({
      id: c.id,
      nombre: c.nombre,
      apellido: c.apellido,
      direccion: c.direccion,
    })
    router.push('/vendedor/catalogo')
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-start gap-3 mb-1">
          <h1 className="text-2xl font-bold text-neo-dark tracking-tight">Clientes</h1>
          <Link href="/vendedor/clientes" className="btn-secondary text-sm whitespace-nowrap inline-flex items-center gap-2">
            <IconPlus className="w-4 h-4" /> Nuevo cliente
          </Link>
        </div>
        <p className="text-gray-600 mb-6">Todos los clientes cargados. Tocá uno para arrancar un pedido con él.</p>

        <div className="card flex gap-2 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por nombre, código o dirección..."
            className="input-field flex-1 min-w-[240px]"
            value={busquedaInput}
            onChange={e => setBusquedaInput(e.target.value)}
          />
          <select className="input-field w-44" value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}>
            <option value="">Todos los vendedores</option>
            {vendedores.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="mb-3 text-sm text-gray-600">{total} clientes</div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Cargando...</div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No se encontraron clientes.</div>
        ) : (
          <div className="space-y-2 mb-6">
            {clientes.map(c => (
              <button
                key={c.id}
                onClick={() => usarCliente(c)}
                className="card w-full text-left hover:border-neo-orange transition-colors"
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-neo-lilac text-neo-lilac-dark font-semibold flex items-center justify-center flex-shrink-0 text-sm">
                      {c.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold truncate">
                        {c.nombre}
                        {c.codigo_cliente && <span className="text-gray-400 font-mono font-normal text-xs"> · #{c.codigo_cliente}</span>}
                      </div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                        {c.direccion && (
                          <span className="inline-flex items-center gap-1">
                            <IconMapPin className="w-3 h-3 flex-shrink-0" /> {c.direccion}
                          </span>
                        )}
                        {c.vendedor_codigo && <span>· Vend. {c.vendedor_codigo}</span>}
                        {c.forma_pago && <span>· {c.forma_pago}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-neo-orange font-bold whitespace-nowrap">Usar →</span>
                </div>
              </button>
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
