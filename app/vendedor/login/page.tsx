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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-neo-orange text-white font-semibold flex items-center justify-center text-sm mx-auto mb-3">
            N
          </div>
          <h1 className="text-base font-semibold text-neo-dark tracking-tight">NEO MERCADO</h1>
          <p className="text-gray-500 text-xs mt-1">Panel de vendedores</p>
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
      </div>
    </div>
  )
}
