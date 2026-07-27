'use client'

import { useState } from 'react'
import { buildCardLink, type CardParam } from '@/lib/deeplink/urlState'

/**
 * "Copy link" action for a detail panel. Produces a URL that reopens this exact card at
 * the current viewport — bands could already be shared, but feature, professional and
 * story cards could not, so the only way to point someone at one was to describe it.
 */
export function CopyCardLink({ kind, id }: { kind: CardParam; id: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const link = buildCardLink(kind, id)
    if (!link) return
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1400)
      })
      .catch(() => {})
  }

  return (
    <button
      className="feature-popup-share"
      onClick={copy}
      title="Copy a link that reopens this card"
      aria-live="polite"
    >
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  )
}
