export interface FocusScaleOptions {
  /** Smallest scale, applied to cards at or beyond the focus radius. */
  min?: number
  /** Largest scale, applied to the card dead-center in the scroll row. */
  max?: number
}

/**
 * Maps a card's distance from the scroll-row centre to a scale factor.
 * The centred card gets `max`; cards at or beyond `radius` get `min`, with a
 * linear falloff in between. Direction is irrelevant — only the magnitude of
 * the offset matters.
 */
export function focusScale(
  distanceFromCenter: number,
  radius: number,
  opts: FocusScaleOptions = {},
): number {
  const { min = 0.9, max = 1.06 } = opts
  if (radius <= 0) return max
  const t = Math.min(Math.abs(distanceFromCenter), radius) / radius
  return max - t * (max - min)
}
