// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { EducationalPopup } from './EducationalPopup'
import { EDUCATIONAL_EXAMPLE_MAP } from '@/data/educationalExamples'

// quartz-crystal is the canonical "verified science + debunked myth" entry:
// it carries a confidence badge, a domain, a per-claim breakdown and sources.
const example = EDUCATIONAL_EXAMPLE_MAP.get('quartz-crystal')!

const renderPopup = (props: Partial<Parameters<typeof EducationalPopup>[0]> = {}) =>
  render(
    <EducationalPopup
      example={example}
      x={100}
      y={100}
      canvasW={1200}
      canvasH={700}
      onClose={() => {}}
      onNavigate={() => {}}
      {...props}
    />,
  )

afterEach(cleanup)

describe('EducationalPopup', () => {
  it('shows the label, discoverer, confidence badge and domain', () => {
    const { container } = renderPopup()
    expect(screen.getByText(example.label)).toBeTruthy()
    expect(screen.getByText(new RegExp(example.discoveredBy.split(' ')[0]))).toBeTruthy()
    // 'Scientifically Verified' appears in the badge and a claim verdict → getAllByText
    expect(screen.getAllByText(example.confidence!).length).toBeGreaterThan(0)
    expect(container.querySelector('.edu-badge-domain')?.textContent).toBe(example.atlasCategory)
  })

  it('renders the per-claim breakdown, marking the myth as pseudoscience', () => {
    const { container } = renderPopup()
    const rows = [...container.querySelectorAll('.edu-claim')]
    expect(rows.length).toBe(example.claims!.length)
    // the debunked claim is explicitly tagged, not stated as fact
    const verdicts = rows.map(r => r.getAttribute('data-confidence'))
    expect(verdicts).toContain('Pseudoscience / Unsupported')
    expect(screen.getByText('Crystal "healing frequencies"')).toBeTruthy()
  })

  it('renders verifiable source links pointing at real URLs', () => {
    const { container } = renderPopup()
    const links = [...container.querySelectorAll('a.edu-source-link')] as HTMLAnchorElement[]
    expect(links.length).toBeGreaterThan(0)
    expect(links.every(a => /^https:\/\//.test(a.href))).toBe(true)
    expect(links.every(a => a.target === '_blank' && a.rel.includes('noopener'))).toBe(true)
  })

  it('calls onNavigate with a related example when a chip is clicked', () => {
    const onNavigate = vi.fn()
    const { container } = renderPopup({ onNavigate })
    const chip = container.querySelector('.edu-chip') as HTMLButtonElement
    expect(chip).toBeTruthy()
    fireEvent.click(chip)
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(EDUCATIONAL_EXAMPLE_MAP.has(onNavigate.mock.calls[0][0].id)).toBe(true)
  })

  it('calls onClose when the close button is pressed', () => {
    const onClose = vi.fn()
    const { container } = renderPopup({ onClose })
    fireEvent.click(container.querySelector('.edu-popup-close') as HTMLButtonElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
