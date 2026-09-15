// Estados posibles de un pedido, en orden de flujo típico. El texto que se guarda en
// orders.estado es el "valor" (sin tildes/espacios); label y colores son solo para mostrar.
export interface EstadoOrden {
  valor: string
  label: string
  dot: string // color del puntito indicador
  badge: string // chip pastel (tabla, remito)
  solid: string // chip sólido (filtro activo)
}

export const ESTADOS_ORDEN: EstadoOrden[] = [
  { valor: 'pendiente', label: 'Pendiente', dot: 'bg-amber-500', badge: 'bg-amber-200 text-amber-900', solid: 'bg-amber-500 text-white' },
  { valor: 'en_preparacion', label: 'En preparación', dot: 'bg-blue-500', badge: 'bg-blue-200 text-blue-900', solid: 'bg-blue-500 text-white' },
  { valor: 'con_faltantes', label: 'Con faltantes', dot: 'bg-orange-500', badge: 'bg-orange-200 text-orange-900', solid: 'bg-orange-500 text-white' },
  { valor: 'preparado', label: 'Preparado', dot: 'bg-neo-lilac-dark', badge: 'bg-neo-lilac text-neo-lilac-dark', solid: 'bg-neo-lilac-dark text-white' },
  { valor: 'facturado', label: 'Facturado', dot: 'bg-emerald-600', badge: 'bg-emerald-200 text-emerald-900', solid: 'bg-emerald-600 text-white' },
  { valor: 'en_reparto', label: 'En reparto', dot: 'bg-indigo-500', badge: 'bg-indigo-200 text-indigo-900', solid: 'bg-indigo-500 text-white' },
  { valor: 'entregado', label: 'Entregado', dot: 'bg-green-600', badge: 'bg-green-200 text-green-900', solid: 'bg-green-600 text-white' },
  { valor: 'cancelado', label: 'Cancelado', dot: 'bg-red-500', badge: 'bg-red-200 text-red-900', solid: 'bg-red-500 text-white' },
]

export function getEstado(valor: string): EstadoOrden {
  return ESTADOS_ORDEN.find(e => e.valor === valor) || ESTADOS_ORDEN[0]
}

// Chip de estado reutilizable: puntito de color + texto, sin emoji. Fondo pastel sólido
// (sin borde) para que se lea de un vistazo sin quedar lavado.
export function EstadoBadge({ valor, className = '' }: { valor: string; className?: string }) {
  const e = getEstado(valor)
  return (
    <span className={`inline-flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full text-sm font-bold leading-none whitespace-nowrap ${e.badge} ${className}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${e.dot}`} />
      <span className="py-px">{e.label}</span>
    </span>
  )
}
