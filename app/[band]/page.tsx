import { redirect } from 'next/navigation'
import spectrumData from '@/data/spectrum.json'
import { LOG_RANGE } from '@/lib/zoom/logMapper'
import type { SpectrumBand } from '@/types/spectrum'

const bands = spectrumData as SpectrumBand[]

interface BandPageProps {
  params: Promise<{ band: string }>
}

export async function generateStaticParams() {
  return bands.map(b => ({ band: b.id }))
}

export async function generateMetadata({ params }: BandPageProps) {
  const { band: bandId } = await params
  const band = bands.find(b => b.id === bandId)
  if (!band) return {}

  const title = `${band.label} — EM Spectrum Visualizer`
  const description = band.description.slice(0, 160)
  return {
    title,
    description,
    openGraph: { title, description },
  }
}

export default async function BandPage({ params }: BandPageProps) {
  const { band: bandId } = await params
  const band = bands.find(b => b.id === bandId)

  if (!band) {
    redirect('/spectrum/')
  }

  const center = Math.sqrt(band.frequency_min * band.frequency_max)
  const logSpan = Math.log10(band.frequency_max) - Math.log10(band.frequency_min)
  const zoom = Math.max(0.5, Math.min(100, LOG_RANGE / (logSpan * 2.5)))

  // Redirect to spectrum page with URL state
  redirect(`/spectrum/?f=${center.toExponential(3)}&z=${zoom.toFixed(2)}`)
}
