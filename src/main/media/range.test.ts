import { describe, expect, it } from 'vitest'
import { parseByteRange } from './range'

describe('parseByteRange', () => {
  it('returns none when there is no Range header', () => {
    expect(parseByteRange(null, 200)).toEqual({ type: 'none' })
  })

  it('parses an inclusive byte range', () => {
    expect(parseByteRange('bytes=0-99', 200)).toEqual({
      type: 'range',
      range: { start: 0, end: 99 },
    })
  })

  it('parses an open-ended range', () => {
    expect(parseByteRange('bytes=100-', 200)).toEqual({
      type: 'range',
      range: { start: 100, end: 199 },
    })
  })

  it('parses a suffix range', () => {
    expect(parseByteRange('bytes=-50', 200)).toEqual({
      type: 'range',
      range: { start: 150, end: 199 },
    })
  })

  it('clamps the end to the last byte', () => {
    expect(parseByteRange('bytes=10-999', 200)).toEqual({
      type: 'range',
      range: { start: 10, end: 199 },
    })
  })

  it('rejects an unsatisfiable range', () => {
    expect(parseByteRange('bytes=200-300', 200)).toEqual({
      type: 'unsatisfiable',
    })
    expect(parseByteRange('bytes=50-10', 200)).toEqual({
      type: 'unsatisfiable',
    })
  })
})
