'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSession, clearSession } from '@/lib/auth'
import { IconHome, IconPlus, IconCart, IconUsers, IconUpload, IconEdit, IconLogOut, IconMenu, IconX } from '@/lib/icons'
import type { ComponentType, SVGProps } from 'react'

const ADMIN_EMAIL = 'admin@neomercado.com'

interface NavItem {
  href: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
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
    { items: [{ href: '/vendedor/dashboard', label: 'Dashboard', icon: IconHome }] },
    {
      label: 'Pedidos',
      items: [
        { href: '/vendedor/clientes', label: 'Nuevo pedido', icon: IconPlus },
        { href: '/vendedor/carrito', label: 'Mi carrito', icon: IconCart, count: carritoCount || undefined },
      ],
    },
    {
      label: 'Clientes',
      items: [{ href: '/vendedor/clientes/lista', label: 'Ver todos', icon: IconUsers }],
    },
    ...(esAdmin
      ? [
          {
            label: 'Admin',
            items: [
              { href: '/vendedor/importar', label: 'Importar Excel', icon: IconUpload },
              { href: '/vendedor/productos', label: 'Editar productos', icon: IconEdit },
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
      <div className="px-4 py-4 border-b border-gray-100">
        <p className="font-bold leading-tight truncate text-[15px] tracking-tight">
          <span className="text-neo-orange">N</span><span className="text-neo-dark">EO MERCADO</span>
        </p>
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
                <span className="flex items-center gap-2.5 truncate">
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {!!item.count && <span className="nav-count">{item.count}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between gap-2 px-1 mb-1">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-neo-dark truncate">{esAdmin ? 'Admin' : sesion.email}</p>
            <p className="text-[11px] text-gray-400 truncate">{esAdmin ? sesion.email : 'Vendedor'}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 flex-shrink-0" aria-label="Cerrar sesión">
            <IconLogOut className="w-4 h-4" />
          </button>
        </div>
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
        <p className="font-bold text-[15px] tracking-tight">
          <span className="text-neo-orange">N</span><span className="text-neo-dark">EO MERCADO</span>
        </p>
        <button onClick={() => setMenuAbierto(true)} className="text-neo-dark" aria-label="Abrir menú">
          <IconMenu className="w-6 h-6" />
        </button>
      </div>

      {/* Menú mobile (overlay) */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-white h-full shadow-xl flex flex-col">
            <div className="flex justify-end px-3 pt-3">
              <button onClick={() => setMenuAbierto(false)} className="text-gray-400" aria-label="Cerrar menú">
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 -mt-3">{nav}</div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMenuAbierto(false)} />
        </div>
      )}

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
