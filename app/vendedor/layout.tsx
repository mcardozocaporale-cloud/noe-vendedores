'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSession, clearSession } from '@/lib/auth'

const ADMIN_EMAIL = 'admin@neomercado.com'

interface NavItem {
  href: string
  label: string
  icon: string
  count?: number
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

export default function VendedorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sesion, setSesion] = useState<{ vendorId: string; email: string } | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [carritoCount, setCarritoCount] = useState(0)

  useEffect(() => {
    setSesion(getSession())
  }, [pathname])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('carrito_vendedor')
      const items = raw ? JSON.parse(raw) : []
      setCarritoCount(Array.isArray(items) ? items.length : 0)
    } catch {
      setCarritoCount(0)
    }
  }, [pathname])

  useEffect(() => {
    setMenuAbierto(false)
  }, [pathname])

  // La pantalla de login no lleva sidebar.
  if (pathname === '/vendedor/login' || !sesion) {
    return <>{children}</>
  }

  const esAdmin = sesion.email === ADMIN_EMAIL

  const grupos: NavGroup[] = [
    { items: [{ href: '/vendedor/dashboard', label: 'Dashboard', icon: '🏠' }] },
    {
      label: 'Pedidos',
      items: [
        { href: '/vendedor/clientes', label: 'Nuevo pedido', icon: '➕' },
        { href: '/vendedor/carrito', label: 'Mi carrito', icon: '🛒', count: carritoCount || undefined },
      ],
    },
    {
      label: 'Clientes',
      items: [{ href: '/vendedor/clientes/lista', label: 'Ver todos', icon: '📇' }],
    },
    ...(esAdmin
      ? [
          {
            label: 'Admin',
            items: [
              { href: '/vendedor/importar', label: 'Importar Excel', icon: '📥' },
              { href: '/vendedor/productos', label: 'Editar productos', icon: '✎' },
            ],
          },
        ]
      : []),
  ]

  function esActivo(href: string) {
    return pathname === href
  }

  function handleLogout() {
    clearSession()
    router.push('/vendedor/login')
  }

  const nav = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-neo-orange text-white font-black flex items-center justify-center text-lg flex-shrink-0">
          N
        </div>
        <div className="min-w-0">
          <p className="font-black text-neo-dark leading-tight truncate">NEO MERCADO</p>
          <p className="text-[11px] text-gray-400 font-bold tracking-wide uppercase">Panel vendedor</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {grupos.map((grupo, i) => (
          <div key={i}>
            {grupo.label && <p className="nav-section-label">{grupo.label}</p>}
            {grupo.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${esActivo(item.href) ? 'nav-link-active' : ''}`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </span>
                {!!item.count && <span className="nav-count">{item.count}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 truncate px-3 mb-2">{sesion.email}</p>
        <button onClick={handleLogout} className="nav-link w-full text-red-600 hover:bg-red-50">
          <span className="flex items-center gap-2">
            <span>🚪</span> Cerrar sesión
          </span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:block w-64 flex-shrink-0 bg-white border-r border-gray-100 sticky top-0 h-screen">
        {nav}
      </aside>

      {/* Header mobile */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neo-orange text-white font-black flex items-center justify-center text-sm">N</div>
          <span className="font-black text-neo-dark">NEO MERCADO</span>
        </div>
        <button onClick={() => setMenuAbierto(true)} className="text-2xl leading-none" aria-label="Abrir menú">
          ☰
        </button>
      </div>

      {/* Menú mobile (overlay) */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-white h-full shadow-xl">{nav}</div>
          <div className="flex-1 bg-black/40" onClick={() => setMenuAbierto(false)} />
        </div>
      )}

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
