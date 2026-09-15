// Estados posibles de un pedido, en orden de flujo típico. El texto que se guarda en
// orders.estado es el "valor" (sin tildes/espacios); label y colores son solo para mostrar.
// "dot" es la clase de color del puntito indicador (sin emoji); "badge" es el fondo del chip.
export interface EstadoOrden {
  valor: string
  label: string
  dot: string
  badge: string
}

export const ESTADOS_ORDEN: EstadoOrden[] = [
  { valor: 'pendiente', label: 'Pendiente', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border border-amber-200' },
  { valor: 'en_preparacion', label: 'En preparación', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-800 border border-blue-200' },
  { valor: 'con_faltantes', label: 'Con faltantes', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-800 border border-orange-200' },
  { valor: 'preparado', label: 'Preparado', dot: 'bg-neo-lilac-dark', badge: 'bg-neo-lilac/40 text-neo-lilac-dark border border-neo-lilac' },
  { valor: 'facturado', label: 'Facturado', dot: 'bg-emerald-600', badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  { valor: 'en_reparto', label: 'En reparto', dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-800 border border-indigo-200' },
  { valor: 'entregado', label: 'Entregado', dot: 'bg-green-600', badge: 'bg-green-50 text-green-800 border border-green-200' },
  { valor: 'cancelado', label: 'Cancelado', dot: 'bg-red-500', badge: 'bg-red-50 text-red-800 border border-red-200' },
]

export function getEstado(valor: string): EstadoOrden {
  return ESTADOS_ORDEN.find(e => e.valor === valor) || ESTADOS_ORDEN[0]
}

// Chip de estado reutilizable: puntito de color + texto, sin emoji.
export function EstadoBadge({ valor, className = '' }: { valor: string; className?: string }) {
  const e = getEstado(valor)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${e.badge} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
      {e.label}
    </span>
  )
}
