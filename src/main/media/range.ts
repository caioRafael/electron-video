export interface ByteRange {
  start: number
  end: number
}

export type ByteRangeResult =
  | { type: 'none' }
  | { type: 'range'; range: ByteRange }
  | { type: 'unsatisfiable' }

export function parseByteRange(
  rangeHeader: string | null,
  fileSize: number,
): ByteRangeResult {
  if (!rangeHeader) {
    return { type: 'none' }
  }

  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim())

  if (!match || fileSize <= 0) {
    return { type: 'unsatisfiable' }
  }

  const startRaw = match[1]
  const endRaw = match[2]

  if (startRaw === '' && endRaw === '') {
    return { type: 'unsatisfiable' }
  }

  if (startRaw === '') {
    const suffix = Number(endRaw)

    if (!Number.isInteger(suffix) || suffix <= 0) {
      return { type: 'unsatisfiable' }
    }

    return {
      type: 'range',
      range: {
        start: Math.max(0, fileSize - suffix),
        end: fileSize - 1,
      },
    }
  }

  const start = Number(startRaw)
  const end = endRaw === '' ? fileSize - 1 : Number(endRaw)

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0) {
    return { type: 'unsatisfiable' }
  }

  if (start >= fileSize || end < start) {
    return { type: 'unsatisfiable' }
  }

  return {
    type: 'range',
    range: {
      start,
      end: Math.min(end, fileSize - 1),
    },
  }
}
