import { describe, expect, it } from 'vitest'
import { formatTimecode } from './timeline.utils'

describe('formatTimecode', () => {
  it('formats tenths of a second', () => {
    expect(formatTimecode(0)).toBe('00:00.0')
    expect(formatTimecode(0.1)).toBe('00:00.1')
    expect(formatTimecode(1.5)).toBe('00:01.5')
    expect(formatTimecode(12.9)).toBe('00:12.9')
  })

  it('includes hours only when needed', () => {
    expect(formatTimecode(3661.2)).toBe('01:01:01.2')
  })

  it('guards against invalid values', () => {
    expect(formatTimecode(Number.NaN)).toBe('00:00.0')
    expect(formatTimecode(-3)).toBe('00:00.0')
  })
})
