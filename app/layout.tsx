import type { Metadata } from 'next'
import './globals.css'

const titulo = 'Neo Mercado - Catálogo de Pedidos'
const descripcion = 'Catálogo interactivo de productos wholesale. Pedidos por WhatsApp. Envío sin cargo.'

export const metadata: Metadata = {
  metadataBase: new URL('https://noe-vendedores-nu.vercel.app'),
  title: titulo,
  description: descripcion,
  openGraph: {
    title: titulo,
    description: descripcion,
    images: ['/og-image.png'],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: titulo,
    description: descripcion,
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
