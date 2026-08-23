'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { verifyPassword, setSession } from '@/lib/auth'

export default function LoginVendedor() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: dbError } = await supabase
        .from('vendors')
        .select('id, email, password_hash')
        .eq('email', email)
        .single()

      if (dbError || !data) {
        setError('Email o contraseña incorrectos')
        return
      }

      const passwordOk = await verifyPassword(password, data.password_hash)
      if (!passwordOk) {
        setError('Email o contraseña incorrectos')
        return
      }

      setSession(data.id, data.email)
      router.push('/vendedor/dashboard')
    } catch (err) {
      setError('Error en el servidor. Intenta más tarde.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-neo-orange to-orange-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-neo-orange">NEO MERCADO</h1>
          <p className="text-gray-600 text-sm mt-2">Panel de Vendedores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="input-field"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>¿Eres cliente? <Link href="/" className="text-neo-orange font-bold hover:underline">Ver catálogo público</Link></p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-xs text-gray-600">
          <p className="font-bold mb-1">Datos de prueba (admin):</p>
          <p>Email: admin@neomercado.com</p>
          <p>Password: admin123456</p>
        </div>
      </div>
    </div>
  )
}
