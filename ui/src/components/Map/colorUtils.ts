/** Sanitizes CSS color values to prevent injection into inline styles. */
export function sanitizeColor(color: string): string {
  if (/^#[0-9A-Fa-f]{3,8}$/.test(color)) return color
  if (/^var\(--[a-zA-Z0-9-]+\)$/.test(color)) return color
  return '#2563EB'
}

/** Darkens a hex color code by a given percentage. */
export function darkenColor(hexColor: string, percent: number): string {
  const safeColor = sanitizeColor(hexColor)
  if (!safeColor.startsWith('#')) return '#1E293B'

  let hex = safeColor.slice(1)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  const num = parseInt(hex, 16)
  const factor = (100 - percent) / 100

  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * factor))
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * factor))
  const b = Math.max(0, Math.floor((num & 0xff) * factor))

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
