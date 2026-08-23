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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value)
}

export function generateOrderNumber(): string {
  return 'ORD-' + Date.now().toString().slice(-8)
}
