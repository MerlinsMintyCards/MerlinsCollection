import { focusScale } from '@/lib/collectionFocus'

describe('focusScale — mobile center-focus scaling', () => {
  const opts = { min: 0.9, max: 1.06 }

  it('grows the card to max scale when it sits dead-center in the row', () => {
    expect(focusScale(0, 200, opts)).toBe(1.06)
  })

  it('shrinks to min scale once the card reaches the focus radius', () => {
    expect(focusScale(200, 200, opts)).toBe(0.9)
  })

  it('clamps to min scale for cards beyond the focus radius', () => {
    expect(focusScale(500, 200, opts)).toBe(0.9)
  })

  it('eases linearly between the center and the radius', () => {
    // halfway out from center → halfway between max and min
    expect(focusScale(100, 200, opts)).toBeCloseTo(0.98)
  })

  it('is symmetric — direction of offset does not matter', () => {
    expect(focusScale(-100, 200, opts)).toBeCloseTo(0.98)
  })

  it('falls back to max scale when the radius is non-positive', () => {
    expect(focusScale(50, 0, opts)).toBe(1.06)
  })
})
