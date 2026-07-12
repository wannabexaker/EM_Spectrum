'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'em-spectrum:onboarded:v1'

const STEPS: { title: string; body: string; icon: string }[] = [
  {
    icon: '📡',
    title: 'One axis, 40 decades',
    body: 'Every oscillation in the universe on a single logarithmic scale — from Milankovitch climate cycles (10⁻¹³ Hz) to gamma rays (10²⁰ Hz). The bottom lane holds non-EM waves: sound, seismic, mechanical.',
  },
  {
    icon: '🔍',
    title: 'Navigate',
    body: 'Scroll to zoom, drag to pan. Click a coloured lane button (top-right) or press number keys to jump straight to Radio, Visible, X-ray and the rest.',
  },
  {
    icon: '✨',
    title: 'Explore the stories',
    body: 'Click the glowing pins for 130 verified stories — pulsars, whale song, MRI, firefly light. Each shows its discoverer, linked sources, and a colour-coded scientific-confidence badge.',
  },
  {
    icon: '🎛️',
    title: 'Filter the atlas',
    body: 'The Atlas button filters pins by domain (animals, technology, astronomy…) and by rigour — hide everything that is not scientifically verified with one click.',
  },
]

export function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  const dismiss = useCallback(() => {
    try { window.localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
    setVisible(false)
  }, [])

  useEffect(() => {
    let onboarded = false
    try { onboarded = window.localStorage.getItem(STORAGE_KEY) === 'true' } catch { /* treat as first visit */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync of client-only localStorage on mount (SSR-safe; the intended use of an effect)
    if (!onboarded) setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
      else if (e.key === 'ArrowRight') setStep(s => Math.min(s + 1, STEPS.length - 1))
      else if (e.key === 'ArrowLeft') setStep(s => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, dismiss])

  if (!visible) return null

  const s = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <div className="onboard-overlay" role="dialog" aria-modal="true" aria-label="Welcome tour">
      <div className="onboard-card">
        <button className="onboard-skip" onClick={dismiss}>Skip</button>
        <div className="onboard-icon" aria-hidden="true">{s.icon}</div>
        <h2 className="onboard-title">{s.title}</h2>
        <p className="onboard-body">{s.body}</p>

        <div className="onboard-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboard-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="onboard-actions">
          {step > 0 && (
            <button className="onboard-btn ghost" onClick={() => setStep(s => s - 1)}>Back</button>
          )}
          <button
            className="onboard-btn primary"
            onClick={() => (last ? dismiss() : setStep(s => s + 1))}
          >
            {last ? 'Start exploring' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
