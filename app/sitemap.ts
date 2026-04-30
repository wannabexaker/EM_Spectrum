export const dynamic = 'force-static'

import type { MetadataRoute } from 'next'
import spectrumData from '@/data/spectrum.json'
import type { SpectrumBand } from '@/types/spectrum'

const bands = spectrumData as SpectrumBand[]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://em-spectrum.vercel.app'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${base}/spectrum/`, changeFrequency: 'monthly', priority: 0.9 },
  ]

  const bandRoutes: MetadataRoute.Sitemap = bands.map(band => ({
    url: `${base}/${band.id}/`,
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...bandRoutes]
}
