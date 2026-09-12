import { describe, expect, it } from 'vitest'
import {
  clampZoomPercent,
  getPixelsPerSecond,
  MAX_ZOOM_PERCENT,
  MIN_ZOOM_PERCENT,
  PIXELS_PER_SECOND,
} from './timeline.constants'

describe('clampZoomPercent', () => {
  it('keeps the zoom inside the allowed range', () => {
    expect(clampZoomPercent(MIN_ZOOM_PERCENT - 25)).toBe(MIN_ZOOM_PERCENT)
    expect(clampZoomPercent(MAX_ZOOM_PERCENT + 25)).toBe(MAX_ZOOM_PERCENT)
    expect(clampZoomPercent(150)).toBe(150)
  })
})

describe('getPixelsPerSecond', () => {
  it('scales the base density from 100 percent', () => {
    expect(getPixelsPerSecond(100)).toBe(PIXELS_PER_SECOND)
    expect(getPixelsPerSecond(50)).toBe(PIXELS_PER_SECOND * 0.5)
    expect(getPixelsPerSecond(200)).toBe(PIXELS_PER_SECOND * 2)
  })
})
