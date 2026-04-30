import type { Metadata } from 'next'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import './globals.css'

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
