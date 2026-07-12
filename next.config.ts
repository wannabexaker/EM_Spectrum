import type { NextConfig } from 'next'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  // Strict Mode double-mounts effects in dev — incompatible with WebGL
  // (two Applications on the same canvas = context collision)
  reactStrictMode: false,
  // Next 16 blocks cross-origin requests to dev resources (HMR/dev runtime) by
  // default, which silently kills hydration on any device loading the app over
  // the LAN (npm run dev:lan) — the page freezes on the SSR skeleton with zero
  // client-side errors. For cross-machine dev, set DEV_ORIGINS to a comma-separated
  // list of allowed hosts, e.g. DEV_ORIGINS="192.168.1.50,192.168.1.*". Dev-only.
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean),
}

export default nextConfig
