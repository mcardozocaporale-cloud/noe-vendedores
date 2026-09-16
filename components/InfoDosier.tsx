'use client'

import type { ComponentType, ReactNode, SVGProps } from 'react'
import { IconX } from '@/lib/icons'

export function InfoDosier({
  open,
  onClose,
  title,
  icon: Icon,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-neo-dark tracking-tight flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-neo-orange flex-shrink-0" />}
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Cerrar">
            <IconX className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

export function DosierSeccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <p className="nav-section-label !mt-0 !px-0">{titulo}</p>
      {children}
    </div>
  )
}

export function DosierEjemplo({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-600 space-y-1">
      {children}
    </div>
  )
}

export function DosierBotonAyuda({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full border border-gray-300 text-gray-400 text-[11px] font-bold hover:border-neo-orange hover:text-neo-orange transition-colors"
      aria-label="Para qué sirve esto"
    >
      ?
    </button>
  )
}
