import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'

// Self-hosted at build time (offline-safe, no external request, no layout shift).
// Exposed as CSS variables consumed by globals.css and the canvas font helper.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://em-spectrum.vercel.app'),
  title: 'EM Spectrum Visualizer — Explore Every Frequency',
  description:
    'Interactive visualization of the full electromagnetic spectrum from 1 Hz to 10²⁶ Hz. Explore radio waves, microwaves, infrared, visible light, UV, X-rays, and gamma rays with infinite zoom.',
  keywords: [
    'electromagnetic spectrum',
    'frequency visualization',
    'radio waves',
    'visible light',
    'gamma rays',
    'infrared',
    'ultraviolet',
    'microwave',
  ],
  openGraph: {
    title: 'EM Spectrum Visualizer',
    description: 'Infinite zoom visualization of the electromagnetic spectrum — from 1 Hz to 10²⁶ Hz',
    images: ['/og/og-main.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EM Spectrum Visualizer',
    description: 'Explore every frequency in the universe',
    images: ['/og/og-main.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`h-full ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="h-full">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
