'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getSession, setClienteActivo } from '@/lib/auth'
import {
  IconSearch, IconPlus, IconPhone, IconMapPin, IconBuilding,
  IconMail, IconIdCard, IconClock,
} from '@/lib/icons'

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

function Campo({
  label, icon: Icon, children,
}: { label: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </label>
      {children}
    </div>
  )
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
    <div>
      <div className="max-w-3xl mx-auto p-4">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-neo-dark tracking-tight leading-tight">Nuevo pedido</h1>
          <p className="text-gray-500 text-xs">Elegí el cliente para este pedido, o cargá uno nuevo.</p>
        </div>

        {!mostrarForm ? (
          <>
            <div className="relative mb-4">
              <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, empresa o documento..."
                className="input-field pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                autoFocus
              />
            </div>

            {buscando && <p className="text-gray-500 text-sm mb-4">Buscando...</p>}

            {!buscando && resultados.length === 0 && (
              <p className="text-gray-500 text-sm mb-4 py-2">
                {busqueda ? 'No se encontraron clientes con ese criterio.' : 'No tenés clientes cargados todavía.'}
              </p>
            )}

            {resultados.length > 0 && (
              <div className="space-y-2 mb-6">
                {resultados.map(c => (
                  <button
                    key={c.id}
                    onClick={() => elegirCliente(c)}
                    className="card w-full text-left hover:border-neo-orange transition-colors"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-neo-lilac text-neo-lilac-dark font-semibold text-sm flex items-center justify-center flex-shrink-0">
                          {c.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-neo-dark truncate">
                            {c.apellido ? `${c.apellido}, ${c.nombre}` : c.nombre}
                          </div>
                          {c.empresa && <div className="text-sm text-gray-600 truncate">{c.empresa}</div>}
                          <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                            {c.telefono && (
                              <span className="inline-flex items-center gap-1"><IconPhone className="w-3 h-3" /> {c.telefono}</span>
                            )}
                            {c.localidad && (
                              <span className="inline-flex items-center gap-1"><IconMapPin className="w-3 h-3" /> {c.localidad}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-neo-orange font-bold text-sm whitespace-nowrap">Usar →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { setMostrarForm(true); setNuevoCliente({ ...clienteVacio, nombre: busqueda }) }}
              className="btn-secondary w-full inline-flex items-center justify-center gap-2 border-dashed bg-transparent hover:bg-gray-50"
            >
              <IconPlus className="w-3.5 h-3.5" /> Cliente nuevo
            </button>
          </>
        ) : (
          <form onSubmit={crearCliente} className="card">
            <h2 className="text-lg font-bold text-neo-dark mb-5">Cliente nuevo</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            <p className="nav-section-label !mt-0 !px-0">Datos del cliente</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Campo label="Nombre *">
                <input type="text" className="input-field" value={nuevoCliente.nombre}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
              </Campo>
              <Campo label="Apellido *">
                <input type="text" className="input-field" value={nuevoCliente.apellido}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })} />
              </Campo>
              <Campo label="Empresa" icon={IconBuilding}>
                <input type="text" className="input-field" value={nuevoCliente.empresa}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, empresa: e.target.value })} />
              </Campo>
              <Campo label="Documento (opcional)" icon={IconIdCard}>
                <input type="text" className="input-field" value={nuevoCliente.numero_documento}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, numero_documento: e.target.value })} />
              </Campo>
            </div>

            <p className="nav-section-label !px-0">Contacto</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Campo label="Teléfono" icon={IconPhone}>
                <input type="tel" className="input-field" value={nuevoCliente.telefono}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
              </Campo>
              <Campo label="Email" icon={IconMail}>
                <input type="email" className="input-field" value={nuevoCliente.email}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
              </Campo>
            </div>

            <p className="nav-section-label !px-0">Entrega</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Campo label="Dirección de entrega" icon={IconMapPin}>
                <input type="text" className="input-field" value={nuevoCliente.direccion}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} />
              </Campo>
              <Campo label="Zona / Localidad">
                <input type="text" className="input-field" value={nuevoCliente.localidad}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, localidad: e.target.value })} />
              </Campo>
              <Campo label="Horario de recepción" icon={IconClock}>
                <input type="text" className="input-field" placeholder="Ej: 8 a 12hs" value={nuevoCliente.horario_recepcion}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, horario_recepcion: e.target.value })} />
              </Campo>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setMostrarForm(false)} className="btn-secondary flex-1">
                Volver a buscar
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
