'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSession, clearSession } from '@/lib/auth'
import { IconHome, IconPlus, IconCart, IconUsers, IconUpload, IconEdit, IconTag, IconTruck, IconLogOut, IconMenu, IconX } from '@/lib/icons'
import type { ComponentType, SVGProps } from 'react'

const ADMIN_EMAIL = 'admin@neomercado.com'

interface NavItem {
  href: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  count?: number
  ayuda?: { objetivo: string; pasos: string[] }
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
  const [ayudaAbierta, setAyudaAbierta] = useState<NavItem | null>(null)

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
              {
                href: '/vendedor/ofertas',
                label: 'Ofertas de proveedores',
                icon: IconTag,
                ayuda: {
                  objetivo: 'Guardar y comparar automáticamente las ofertas de precios que te mandan los proveedores por WhatsApp, para saber si conviene comprarles.',
                  pasos: [
                    'Subí una foto o pegá el texto de la oferta que te llegó.',
                    'El sistema detecta los productos y precios, y los compara con tu catálogo y con ofertas anteriores.',
                    'En el historial, "Bajó — conviene" significa mejor precio que la última vez que te ofrecieron ese producto.',
                  ],
                },
              },
              {
                href: '/vendedor/reposicion',
                label: 'Qué reponer',
                icon: IconTruck,
                ayuda: {
                  objetivo: 'Saber qué productos se te están por terminar según lo que ya vendiste, y a qué proveedor/precio los conseguiste la última vez.',
                  pasos: [
                    'La lista se arma sola con lo que vendiste en los últimos 30 días y el stock cargado.',
                    'Lo marcado "Urgente" es lo que se agota primero.',
                    'Cuando compres algo, usá "Sumar stock" en esa fila para actualizarlo ahí mismo.',
                  ],
                },
              },
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
              <div key={item.href} className="flex items-center gap-1">
                <Link
                  href={item.href}
                  className={`nav-link flex-1 min-w-0 ${esActivo(item.href) ? 'nav-link-active' : ''}`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {!!item.count && <span className="nav-count">{item.count}</span>}
                </Link>
                {item.ayuda && (
                  <button
                    onClick={() => setAyudaAbierta(item)}
                    className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full border border-gray-300 text-gray-400 text-[11px] font-bold hover:border-neo-orange hover:text-neo-orange transition-colors"
                    aria-label={`Cómo se usa: ${item.label}`}
                  >
                    ?
                  </button>
                )}
              </div>
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

      {/* Dosier de ayuda por sección */}
      {ayudaAbierta && ayudaAbierta.ayuda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAyudaAbierta(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-neo-dark tracking-tight flex items-center gap-2">
                <ayudaAbierta.icon className="w-4 h-4 text-neo-orange flex-shrink-0" />
                {ayudaAbierta.label}
              </h3>
              <button onClick={() => setAyudaAbierta(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Cerrar">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{ayudaAbierta.ayuda.objetivo}</p>
            <p className="nav-section-label !mt-0 !px-0">Cómo se usa</p>
            <ol className="space-y-2">
              {ayudaAbierta.ayuda.pasos.map((paso, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-4 h-4 flex-shrink-0 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {paso}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
