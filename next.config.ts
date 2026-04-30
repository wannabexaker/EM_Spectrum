import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  allowedDevOrigins: ['host.docker.internal'],
  images: { unoptimized: true },
  // Strict Mode double-mounts effects in dev — incompatible with WebGL
  // (two Applications on the same canvas = context collision)
  reactStrictMode: false,
}

export default nextConfig
