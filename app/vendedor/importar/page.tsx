'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

interface ProductoSinImagen {
  id: string
  nombre: string
}

interface ResumenCategoria {
  categoria: string
  actualizados: number
  insertados: number
  eliminados: number
  faltaImagen: ProductoSinImagen[]
  errores: string[]
}

const ADMIN_EMAIL = 'admin@neomercado.com'

// Redimensiona/comprime la foto en el navegador antes de mandarla, para no guardar
// fotos de celular de varios MB como base64 en la base.
function comprimirImagen(file: File, maxLado = 900, calidad = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxLado || height > maxLado) {
          if (width > height) {
            height = Math.round((height * maxLado) / width)
            width = maxLado
          } else {
            width = Math.round((width * maxLado) / height)
            height = maxLado
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('No se pudo procesar la imagen.'))
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', calidad)
        resolve(dataUrl.replace(/^data:image\/\w+;base64,/, ''))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function ImportarExcel() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState<boolean | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState(0)
  const [categoria, setCategoria] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [categorias, setCategorias] = useState<ResumenCategoria[] | null>(null)
  const [error, setError] = useState('')
  const [subiendoFoto, setSubiendoFoto] = useState<string | null>(null)
  const [fotosOk, setFotosOk] = useState<Set<string>>(new Set())

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
    setCategorias(null)
    setFotosOk(new Set())

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

      setCategorias(data.categorias)
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo.')
    } finally {
      setSubiendo(false)
      // Se remonta el input de archivo (en vez de solo limpiar el estado) para evitar que el
      // navegador no dispare el evento de cambio si se vuelve a elegir el mismo archivo.
      setArchivo(null)
      setInputKey(k => k + 1)
    }
  }

  async function subirFotoProducto(id: string, file: File) {
    setSubiendoFoto(id)
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
      setFotosOk(prev => new Set(prev).add(id))
    } catch (err: any) {
      setError(err.message || 'Error al subir la foto.')
    } finally {
      setSubiendoFoto(null)
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
          Subí el Excel con la estructura habitual (Código, Producto, variedad, Categoría, Subrubro, pack,
          existencia, Precio, Precio Vol, Precio Liq, Activo, especial). Podés subir varias categorías juntas
          en el mismo archivo — se procesa cada Subrubro por separado. "Activo" manda: si un producto tiene
          Activo=0 se desactiva en la web aunque tenga existencia.
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
              key={inputKey}
              type="file"
              accept=".xlsx,.xls"
              onChange={e => setArchivo(e.target.files?.[0] || null)}
              className="input-field"
            />
            {!archivo && (
              <p className="text-xs text-gray-500 mt-1">Elegí un archivo para poder subirlo.</p>
            )}
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

        {categorias && categorias.map((resumen, idx) => (
          <div className="card mb-4" key={idx}>
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
                <div className="text-2xl font-bold text-gray-700">{resumen.eliminados}</div>
                <div className="text-xs text-gray-600">Eliminados</div>
              </div>
            </div>

            {resumen.faltaImagen.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-3">
                <p className="font-bold text-sm mb-2">⚠️ Productos sin foto — subila acá directamente:</p>
                <ul className="text-sm space-y-2">
                  {resumen.faltaImagen.map(p => (
                    <li key={p.id} className="flex items-center justify-between gap-2 bg-white rounded border border-yellow-200 px-3 py-2">
                      <span className="flex-1">{p.nombre}</span>
                      {fotosOk.has(p.id) ? (
                        <span className="text-green-700 font-bold text-xs whitespace-nowrap">✅ Subida</span>
                      ) : subiendoFoto === p.id ? (
                        <span className="text-gray-500 text-xs whitespace-nowrap">Subiendo...</span>
                      ) : (
                        <label className="btn-secondary text-xs cursor-pointer whitespace-nowrap">
                          📷 Subir foto
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) subirFotoProducto(p.id, file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      )}
                    </li>
                  ))}
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
        ))}
      </div>
    </div>
  )
}
