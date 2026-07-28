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

// Browser zoom stays available. It was disabled to stop pinch fighting the canvas's own
// zoom, but the canvas already sets touch-action: none, so gestures over it never reach
// the browser — while blocking it page-wide left anyone who needs to magnify the UI with
// no way to do it (WCAG 1.4.4).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// Canonical and social URLs are built from this. It pointed at a vercel.app host the app
// is not deployed on, so every absolute URL in the metadata resolved to somewhere that
// does not serve this site. Falls back to the GitHub Pages deployment, including the base
// path the portfolio build mounts it under.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  `https://wannabexaker.github.io${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}`

// Fully qualified on purpose. Next resolves a root-relative metadata image against
// metadataBase's *origin* only, dropping its path — under the portfolio's
// basePath: '/em-spectrum' that produced /og/og-main.jpg, which 404s, because the asset
// actually ships at /em-spectrum/og/og-main.jpg.
const ogImageUrl = `${siteUrl}/og/og-main.jpg`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'EM Spectrum Visualizer — Explore Every Frequency',
  description:
    'Interactive visualization of the full electromagnetic spectrum from 10⁻¹⁴ Hz to 10²⁶ Hz — 40 decades on one logarithmic axis. Explore radio waves, microwaves, infrared, visible light, UV, X-rays and gamma rays with infinite zoom, plus a lane for non-EM oscillations.',
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
  // og-main.jpg is a real 1200x630 capture of the visualizer's own canvas — labelled
  // phenomena with their "+N" density badges across the lanes — not a mockup. The previous
  // reference pointed at an og-main.png that never existed, so every share advertised a
  // preview image that 404d.
  openGraph: {
    title: 'EM Spectrum Visualizer',
    description: 'Infinite zoom visualization of the electromagnetic spectrum — from 10⁻¹⁴ Hz to 10²⁶ Hz',
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'The electromagnetic spectrum rendered across eight logarithmic lanes' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EM Spectrum Visualizer',
    description: 'Explore every frequency in the universe',
    images: [ogImageUrl],
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
