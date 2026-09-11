import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { parseByteRange } from './range'

const MIME_TYPES: Record<string, string> = {
  aac: 'audio/aac',
  aif: 'audio/aiff',
  aiff: 'audio/aiff',
  avif: 'image/avif',
  avi: 'video/x-msvideo',
  bmp: 'image/bmp',
  flac: 'audio/flac',
  gif: 'image/gif',
  heic: 'image/heic',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4a: 'audio/mp4',
  m4v: 'video/x-m4v',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  ogg: 'audio/ogg',
  opus: 'audio/opus',
  png: 'image/png',
  svg: 'image/svg+xml',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  wav: 'audio/wav',
  webm: 'video/webm',
  webp: 'image/webp',
  wma: 'audio/x-ms-wma',
  wmv: 'video/x-ms-wmv',
}

export function getAssetMimeType(filePath: string): string {
  const extension = path.extname(filePath).slice(1).toLowerCase()
  return MIME_TYPES[extension] ?? 'application/octet-stream'
}

export async function createAssetFileResponse(
  filePath: string,
  rangeHeader: string | null,
): Promise<Response> {
  const fileStat = await stat(filePath)
  const mimeType = getAssetMimeType(filePath)
  const rangeResult = parseByteRange(rangeHeader, fileStat.size)

  if (rangeResult.type === 'unsatisfiable') {
    return new Response(null, {
      status: 416,
      headers: {
        'Content-Range': `bytes */${fileStat.size}`,
        'Accept-Ranges': 'bytes',
      },
    })
  }

  if (rangeResult.type === 'none') {
    const stream = createReadStream(filePath)

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileStat.size),
        'Accept-Ranges': 'bytes',
      },
    })
  }

  const { start, end } = rangeResult.range
  const stream = createReadStream(filePath, { start, end })

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 206,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
      'Accept-Ranges': 'bytes',
    },
  })
}
