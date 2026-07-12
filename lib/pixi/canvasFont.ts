/**
 * Resolves the self-hosted display font family for <canvas> / PixiJS text.
 *
 * next/font hashes the family name (e.g. "__Space_Grotesk_abc123") and exposes it
 * as the CSS variable --font-space-grotesk on <html>. Canvas 2D and PixiJS take a
 * concrete family string, not a CSS variable, so we read the resolved value once
 * here and cache it. Falls back to the plain family name during SSR or before the
 * variable is applied.
 */
let cached: string | null = null

export function canvasFontFamily(): string {
  if (cached) return cached
  const fallback = "'Space Grotesk', sans-serif"
  if (typeof document === 'undefined') return fallback
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-space-grotesk')
    .trim()
  if (!resolved) return fallback
  cached = `${resolved}, 'Space Grotesk', sans-serif`
  return cached
}
