'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

interface Resumen {
  categoria: string
  actualizados: number
  insertados: number
  ocultados: number
  nuevosSinImagen: string[]
  errores: string[]
}

const ADMIN_EMAIL = 'admin@neomercado.com'

export default function ImportarExcel() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [autorizado, setAutorizado] = useState<boolean | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [categoria, setCategoria] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/vendedor/login')
      return
    }
    setAutorizado(session.email === ADMIN_EMAIL)
  }, [router])

  async function subirArchivo(e: React.FormEvent) {
    e.preventDefault()
    if (!archivo) {
      setError('Elegí un archivo Excel primero.')
      return
    }

    setSubiendo(true)
    setError('')
    setResumen(null)

    try {
      const formData = new FormData()
      formData.append('file', archivo)
      if (categoria.trim()) formData.append('categoria', categoria.trim())

      const res = await fetch('/api/importar-excel', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el archivo.')
      }

      setResumen(data.resumen)
      setArchivo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo.')
    } finally {
      setSubiendo(false)
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
        <div className="max-w-2xl mx-auto">
          <Link href="/vendedor/dashboard" className="font-bold text-lg">← NEO MERCADO</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-1">Importar Excel</h1>
        <p className="text-gray-600 mb-6">
          Subí el Excel con la misma estructura de siempre (Código, Producto, Categoría, Subrubro, existencia,
          pack, costo, precios, activo, especial). Actualiza precios y stock, agrega productos nuevos, y oculta
          los que ya no figuren en el archivo.
        </p>

        <form onSubmit={subirArchivo} className="card mb-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Archivo Excel (.xlsx)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={e => setArchivo(e.target.files?.[0] || null)}
              className="input-field"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">
              Categoría <span className="font-normal text-gray-500">(opcional — si no la ponés, se detecta sola)</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Aceites"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="input-field"
            />
          </div>

          <button type="submit" disabled={subiendo || !archivo} className="btn-primary w-full">
            {subiendo ? 'Procesando...' : 'Subir y sincronizar'}
          </button>
        </form>

        {resumen && (
          <div className="card">
            <h2 className="text-lg font-bold mb-4">✅ Categoría: {resumen.categoria}</h2>
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="text-2xl font-bold text-green-700">{resumen.actualizados}</div>
                <div className="text-xs text-gray-600">Actualizados</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-2xl font-bold text-blue-700">{resumen.insertados}</div>
                <div className="text-xs text-gray-600">Nuevos</div>
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded p-3">
                <div className="text-2xl font-bold text-gray-700">{resumen.ocultados}</div>
                <div className="text-xs text-gray-600">Ocultados</div>
              </div>
            </div>

            {resumen.nuevosSinImagen.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-3">
                <p className="font-bold text-sm mb-1">⚠️ Productos nuevos sin foto todavía:</p>
                <ul className="text-sm list-disc list-inside">
                  {resumen.nuevosSinImagen.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}

            {resumen.errores.length > 0 && (
              <div className="bg-red-50 border border-red-300 rounded p-3">
                <p className="font-bold text-sm mb-1">Errores:</p>
                <ul className="text-sm list-disc list-inside">
                  {resumen.errores.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
