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
}

export default nextConfig
