import { describe, expect, it } from 'vitest'
import { sourcesForStandard } from './standardSources'
import { PROFESSIONAL_SUB_BANDS, PROFESSIONAL_TECH_OVERLAYS } from './professionalSpectrum'

describe('sourcesForStandard', () => {
  it('cites the specific standard first, not just the treaty', () => {
    const [primary] = sourcesForStandard('3GPP TS 38.104')
    expect(primary.label).toBe('3GPP TS 38.104')
    expect(primary.url).toContain('3gpp.org')
  })

  it('keeps the Radio Regulations as the secondary citation for allocations', () => {
    const labels = sourcesForStandard('IEEE 802.11ax').map(s => s.label)
    expect(labels).toEqual(['IEEE 802.11ax', 'ITU Radio Regulations'])
  })

  it('does not cite the Radio Regulations twice for an RR reference', () => {
    const sources = sourcesForStandard('ITU RR Article 25')
    expect(sources).toHaveLength(1)
  })

  it('omits the treaty for things that occupy a band without being allocated one', () => {
    const labels = sourcesForStandard('IEC 60825-1', false).map(s => s.label)
    expect(labels).toEqual(['IEC 60825-1'])
  })

  it('names a paywalled standard instead of linking somewhere that would rot', () => {
    const [primary] = sourcesForStandard('IEC 60601-1')
    expect(primary.url).toBeUndefined()
    expect(primary.note).toMatch(/no stable public link/i)
  })

  it('falls back to the treaty when no governing standard is known', () => {
    expect(sourcesForStandard(undefined).map(s => s.label)).toEqual(['ITU Radio Regulations'])
  })
})

describe('professional dataset provenance', () => {
  it('gives every allocation and sub-band at least one citation', () => {
    for (const band of PROFESSIONAL_SUB_BANDS) {
      expect(band.sources?.length, band.id).toBeGreaterThan(0)
      expect(band.confidence, band.id).toBeTruthy()
    }
    for (const tech of PROFESSIONAL_TECH_OVERLAYS) {
      expect(tech.sources?.length, tech.id).toBeGreaterThan(0)
      expect(tech.confidence, tech.id).toBeTruthy()
    }
  })

  it('only ever links to https URLs', () => {
    const urls = [...PROFESSIONAL_SUB_BANDS, ...PROFESSIONAL_TECH_OVERLAYS]
      .flatMap(item => item.sources ?? [])
      .map(source => source.url)
      .filter(Boolean) as string[]
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) expect(url.startsWith('https://'), url).toBe(true)
  })

  it('flags the allocations that are not worldwide', () => {
    // Marking only the standard implies a global allocation; 902-928 MHz is Region 2 and
    // 868 MHz is Europe, so a reader planning hardware around either would be misled.
    const scoped = new Map(PROFESSIONAL_TECH_OVERLAYS.map(t => [t.id, t.regionScope]))
    for (const id of ['ism-915', 'iot-868', 'ism-433', 'wifi-6e', 'wigig-60']) {
      expect(scoped.get(id), id).toBeTruthy()
    }
    // Genuinely global allocations must not carry a caveat that would imply otherwise.
    for (const id of ['pro-gps-l1', 'nfc-1356', 'aviation-vhf']) {
      expect(scoped.get(id), id).toBeUndefined()
    }
  })

  it('cites the band nomenclature only for the bands ITU-R V.431 actually names', () => {
    // The optical and ionizing regions are conventional, not standardised, so borrowing
    // the ITU citation for them would overstate how settled their edges are.
    for (const band of PROFESSIONAL_SUB_BANDS) {
      const citesItu = (band.sources ?? []).some(s => s.label.includes('V.431'))
      const isOptical = ['pro-infrared', 'pro-visible', 'pro-uv', 'pro-xray', 'pro-gamma'].includes(band.id)
      expect(citesItu, band.id).toBe(!isOptical)
      if (isOptical) expect(band.confidence, band.id).toBe('Estimated / Approximate')
    }
  })
})
