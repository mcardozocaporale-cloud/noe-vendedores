'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getSession, setClienteActivo } from '@/lib/auth'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  empresa: string | null
  tipo_documento: string | null
  numero_documento: string | null
  telefono: string | null
  direccion: string | null
  localidad: string | null
  horario_recepcion: string | null
}

const clienteVacio = {
  nombre: '',
  apellido: '',
  empresa: '',
  tipo_documento: 'DNI',
  numero_documento: '',
  email: '',
  telefono: '',
  direccion: '',
  localidad: '',
  horario_recepcion: '',
}

export default function ClientesVendedor() {
  const router = useRouter()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<Cliente[]>([])
  const [buscando, setBuscando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState(clienteVacio)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }
    setVendorId(session.vendorId)
  }, [router])

  // Búsqueda con debounce
  useEffect(() => {
    if (!vendorId) return
    const timeout = setTimeout(() => buscarClientes(), 300)
    return () => clearTimeout(timeout)
  }, [busqueda, vendorId])

  async function buscarClientes() {
    if (!vendorId) return
    setBuscando(true)

    let query = supabase
      .from('clientes')
      .select('id, nombre, apellido, empresa, tipo_documento, numero_documento, telefono, direccion, localidad, horario_recepcion')
      .eq('vendor_id', vendorId)
      .order('apellido')
      .limit(30)

    if (busqueda.trim()) {
      const texto = busqueda.trim().replace(/,/g, ' ')
      query = query.or(`nombre.ilike.%${texto}%,apellido.ilike.%${texto}%,empresa.ilike.%${texto}%,numero_documento.ilike.%${texto}%`)
    }

    const { data, error } = await query
    if (!error && data) {
      setResultados(data)
    }
    setBuscando(false)
  }

  function elegirCliente(cliente: Cliente) {
    setClienteActivo({
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      empresa: cliente.empresa,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      localidad: cliente.localidad,
      horario_recepcion: cliente.horario_recepcion,
    })
    router.push('/vendedor/catalogo')
  }

  async function crearCliente(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!nuevoCliente.nombre || !nuevoCliente.apellido) {
      setError('Nombre y apellido son obligatorios')
      return
    }

    setGuardando(true)
    const { data, error: insErr } = await supabase
      .from('clientes')
      .insert({
        vendor_id: vendorId,
        nombre: nuevoCliente.nombre,
        apellido: nuevoCliente.apellido,
        empresa: nuevoCliente.empresa || null,
        tipo_documento: nuevoCliente.tipo_documento || null,
        numero_documento: nuevoCliente.numero_documento || null,
        email: nuevoCliente.email || null,
        telefono: nuevoCliente.telefono || null,
        direccion: nuevoCliente.direccion || null,
        localidad: nuevoCliente.localidad || null,
        horario_recepcion: nuevoCliente.horario_recepcion || null,
      })
      .select()
      .single()

    setGuardando(false)

    if (insErr || !data) {
      if (insErr?.message?.includes('numero_documento')) {
        setError('Ya existe un cliente con ese número de documento')
      } else {
        setError('Error al crear el cliente. Intenta de nuevo.')
      }
      return
    }

    elegirCliente(data)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-neo-orange text-white py-4 px-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link href="/vendedor/dashboard" className="font-bold text-lg">← NEO MERCADO</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-1">Nuevo Pedido</h1>
        <p className="text-gray-600 mb-6">Primero elegí el cliente para este pedido.</p>

        {!mostrarForm ? (
          <>
            <div className="card mb-4">
              <label className="block text-sm font-bold mb-2">Buscar cliente</label>
              <input
                type="text"
                placeholder="Nombre, apellido, empresa o documento..."
                className="input-field"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                autoFocus
              />
            </div>

            {buscando && <p className="text-gray-500 text-sm mb-4">Buscando...</p>}

            {!buscando && resultados.length === 0 && (
              <p className="text-gray-600 mb-4">
                {busqueda ? 'No se encontraron clientes con ese criterio.' : 'No tenés clientes cargados todavía.'}
              </p>
            )}

            <div className="space-y-2 mb-6">
              {resultados.map(c => (
                <button
                  key={c.id}
                  onClick={() => elegirCliente(c)}
                  className="card w-full text-left hover:border-neo-orange border-2 border-transparent transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">{c.apellido}, {c.nombre}</div>
                      {c.empresa && <div className="text-sm text-gray-600">{c.empresa}</div>}
                      <div className="text-xs text-gray-500">
                        {c.telefono && `📞 ${c.telefono}`}
                        {c.localidad && ` · ${c.localidad}`}
                      </div>
                    </div>
                    <span className="text-neo-orange font-bold">Usar →</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setMostrarForm(true); setNuevoCliente({ ...clienteVacio, nombre: busqueda }) }}
              className="btn-primary w-full"
            >
              + Cliente nuevo
            </button>
          </>
        ) : (
          <form onSubmit={crearCliente} className="card">
            <h2 className="text-xl font-bold mb-4">Cliente nuevo</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-bold mb-1">Nombre *</label>
                <input type="text" className="input-field" value={nuevoCliente.nombre}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Apellido *</label>
                <input type="text" className="input-field" value={nuevoCliente.apellido}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })} />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-bold mb-1">Empresa</label>
              <input type="text" className="input-field" value={nuevoCliente.empresa}
                onChange={e => setNuevoCliente({ ...nuevoCliente, empresa: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-bold mb-1">Teléfono</label>
                <input type="tel" className="input-field" value={nuevoCliente.telefono}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Documento (opcional)</label>
                <input type="text" className="input-field" value={nuevoCliente.numero_documento}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, numero_documento: e.target.value })} />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-bold mb-1">Dirección de entrega</label>
              <input type="text" className="input-field" value={nuevoCliente.direccion}
                onChange={e => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-bold mb-1">Zona / Localidad</label>
                <input type="text" className="input-field" value={nuevoCliente.localidad}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, localidad: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Horario de recepción</label>
                <input type="text" className="input-field" placeholder="Ej: 8 a 12hs" value={nuevoCliente.horario_recepcion}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, horario_recepcion: e.target.value })} />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-1">Email</label>
              <input type="email" className="input-field" value={nuevoCliente.email}
                onChange={e => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setMostrarForm(false)} className="btn-secondary flex-1">
                ← Volver a buscar
              </button>
              <button type="submit" disabled={guardando} className="btn-primary flex-1">
                {guardando ? 'Guardando...' : 'Comenzar pedido'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
