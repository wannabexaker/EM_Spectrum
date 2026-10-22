import type { NextConfig } from 'next'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const nextConfig: NextConfig = {
  output: 'export',
  // Pin the Turbopack filesystem root to this file's directory. Root inference walks
  // up looking for a lockfile, so a build spawned from a parent repo (the portfolio
  // runs `npm run build` in here) could otherwise resolve a root above this project.
  // Defense in depth only: the "Could not find the Next.js package" failure that
  // prompted this was a partial node_modules install, not a root problem.
  turbopack: { root: import.meta.dirname },
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
