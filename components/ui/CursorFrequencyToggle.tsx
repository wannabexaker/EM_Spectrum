'use client'

import { useSpectrumStore } from '@/store/spectrumStore'

/**
 * Toggles the frequency label that follows the pointer reticle.
 *
 * It is a pointer feature: on a touch screen there is no hovering cursor, so it only has
 * any effect mid-drag. That is why it sits in the menu on phones rather than taking one of
 * the few permanent slots in the bottom bar.
 */
export function CursorFrequencyToggle({ className = '' }: { className?: string }) {
  const showCursorFrequency = useSpectrumStore(s => s.showCursorFrequency)
  const toggleCursorFrequency = useSpectrumStore(s => s.toggleCursorFrequency)

  return (
    <button
      className={`hud-cursor-toggle ${showCursorFrequency ? 'active' : ''} ${className}`.trim()}
      onClick={toggleCursorFrequency}
      title="Show frequency next to cursor"
      aria-label="Toggle cursor frequency label"
      aria-pressed={showCursorFrequency}
    >
      cursor Hz
    </button>
  )
}
