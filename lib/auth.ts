import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function setSession(vendorId: string, email: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vendor_id', vendorId)
    localStorage.setItem('vendor_email', email)
  }
}

export function getSession(): { vendorId: string; email: string } | null {
  if (typeof window !== 'undefined') {
    const vendorId = localStorage.getItem('vendor_id')
    const email = localStorage.getItem('vendor_email')
    if (vendorId && email) {
      return { vendorId, email }
    }
  }
  return null
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vendor_id')
    localStorage.removeItem('vendor_email')
  }
}

// Cliente activo del pedido que se está armando (se elige/crea antes de ir al catálogo)
export interface ClienteActivo {
  id: string
  nombre: string
  apellido: string
  empresa?: string | null
  telefono?: string | null
  direccion?: string | null
  localidad?: string | null
  horario_recepcion?: string | null
}

export function setClienteActivo(cliente: ClienteActivo): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cliente_activo', JSON.stringify(cliente))
  }
}

export function getClienteActivo(): ClienteActivo | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('cliente_activo')
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearClienteActivo(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cliente_activo')
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function generateOrderNumber(): string {
  return 'ORD-' + Date.now().toString().slice(-8)
}

// Muchos productos comparten el mismo "nombre" y solo se distinguen por la variedad del Excel
// (queda guardada en "descripcion" — p.ej. 12 "Fideos SOL PAMPEANO 500g" distintos, uno por
// forma: coditos, spaghetti, moños...). Si no se muestra esa variedad, quedan indistinguibles
// en el carrito, el remito y la edición de pedidos. Cuando el producto NO tiene variedad real,
// el sync deja descripcion == nombre (fallback), así que ahí no hay que repetir nada.
export function nombreConVariedad(nombre: string, descripcion?: string | null): string {
  if (!descripcion) return nombre
  const d = descripcion.trim()
  if (!d || d.toLowerCase() === nombre.trim().toLowerCase()) return nombre
  return `${nombre} — ${d}`
}
