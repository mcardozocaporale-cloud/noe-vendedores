import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string
          email: string
          password_hash: string
          nombre: string
          empresa: string
          telefono: string
          direccion: string
          created_at: string
        }
        Insert: {
          email: string
          password_hash: string
          nombre: string
          empresa: string
          telefono?: string
          direccion?: string
        }
      }
      products: {
        Row: {
          id: string
          nombre: string
          descripcion: string
          categoria: string
          precio_unitario: number
          precio_bulto: number
          factor_bulto: number
          precio_min: number
          precio_max: number
          stock: number
          imagen_base64: string
          permite_ajuste_precio: boolean
          created_at: string
        }
      }
      orders: {
        Row: {
          id: string
          vendor_id: string
          numero_orden: string
          estado: 'pendiente' | 'aprobada' | 'entregada' | 'cancelada'
          total: number
          datos_comprador: any
          created_at: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          cantidad: number
          precio_unitario: number
          subtotal: number
        }
      }
    }
  }
}
