// Estados posibles de un pedido, en orden de flujo típico. El texto que se guarda en
// orders.estado es el "valor" (sin tildes/espacios); label y colores son solo para mostrar.
//
// Criterio de color (tomado de las referencias Solve/ControlBabel): en reposo, el color
// se limita a un puntito + el texto — nunca un fondo relleno. Un fondo sólido de color
// se reserva para cuando ese estado está ACTIVAMENTE seleccionado (filtro elegido). Mostrar
// 8 fondos de colores distintos a la vez es lo que lee como infantil; un punto + texto
// prolijo en gris no.
export interface EstadoOrden {
  valor: string
  label: string
  dot: string // color del puntito indicador
  text: string // color del texto en reposo (chip neutro)
  solid: string // chip sólido — solo para el filtro activo
}

export const ESTADOS_ORDEN: EstadoOrden[] = [
  { valor: 'pendiente', label: 'Pendiente', dot: 'bg-amber-500', text: 'text-amber-700', solid: 'bg-amber-500 text-white' },
  { valor: 'en_preparacion', label: 'En preparación', dot: 'bg-blue-500', text: 'text-blue-700', solid: 'bg-blue-500 text-white' },
  { valor: 'con_faltantes', label: 'Con faltantes', dot: 'bg-orange-500', text: 'text-orange-700', solid: 'bg-orange-500 text-white' },
  { valor: 'preparado', label: 'Preparado', dot: 'bg-neo-lilac-dark', text: 'text-neo-lilac-dark', solid: 'bg-neo-lilac-dark text-white' },
  { valor: 'facturado', label: 'Facturado', dot: 'bg-emerald-600', text: 'text-emerald-700', solid: 'bg-emerald-600 text-white' },
  { valor: 'en_reparto', label: 'En reparto', dot: 'bg-indigo-500', text: 'text-indigo-700', solid: 'bg-indigo-500 text-white' },
  { valor: 'entregado', label: 'Entregado', dot: 'bg-green-600', text: 'text-green-700', solid: 'bg-green-600 text-white' },
  { valor: 'cancelado', label: 'Cancelado', dot: 'bg-red-500', text: 'text-red-700', solid: 'bg-red-500 text-white' },
]

export function getEstado(valor: string): EstadoOrden {
  return ESTADOS_ORDEN.find(e => e.valor === valor) || ESTADOS_ORDEN[0]
}

// Chip de estado reutilizable: fondo neutro + puntito de color + texto en ese mismo color.
// Nada de fondo relleno — así se lee prolijo aunque haya varios juntos en una tabla.
export function EstadoBadge({ valor, className = '' }: { valor: string; className?: string }) {
  const e = getEstado(valor)
  return (
    <span className={`inline-flex items-center gap-2 pl-2.5 pr-3 py-1 rounded-full text-xs font-bold leading-none whitespace-nowrap bg-gray-50 border border-gray-200 ${e.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.dot}`} />
      <span className="py-px">{e.label}</span>
    </span>
  )
}
