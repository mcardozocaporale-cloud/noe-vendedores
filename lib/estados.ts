// Estados posibles de un pedido, en orden de flujo típico. El texto que se guarda en
// orders.estado es el "valor" (sin tildes/espacios); emoji y label son solo para mostrar.
export interface EstadoOrden {
  valor: string
  emoji: string
  label: string
  badge: string // clases de color para el chip
}

export const ESTADOS_ORDEN: EstadoOrden[] = [
  { valor: 'pendiente', emoji: '🟡', label: 'Pendiente', badge: 'bg-yellow-100 text-yellow-800' },
  { valor: 'en_preparacion', emoji: '🔵', label: 'En preparación', badge: 'bg-blue-100 text-blue-800' },
  { valor: 'con_faltantes', emoji: '🟠', label: 'Con faltantes', badge: 'bg-orange-100 text-orange-800' },
  { valor: 'preparado', emoji: '🟣', label: 'Preparado', badge: 'bg-purple-100 text-purple-800' },
  { valor: 'facturado', emoji: '🟢', label: 'Facturado', badge: 'bg-green-100 text-green-800' },
  { valor: 'en_reparto', emoji: '🚚', label: 'En reparto', badge: 'bg-indigo-100 text-indigo-800' },
  { valor: 'entregado', emoji: '✅', label: 'Entregado', badge: 'bg-emerald-100 text-emerald-800' },
  { valor: 'cancelado', emoji: '🔴', label: 'Cancelado', badge: 'bg-red-100 text-red-800' },
]

export function getEstado(valor: string): EstadoOrden {
  return ESTADOS_ORDEN.find(e => e.valor === valor) || ESTADOS_ORDEN[0]
}
