import { describe, expect, it } from 'vitest'
import {
  parseEncoderNames,
  pickLgplH264Encoder,
  resolvePatchworkBinary,
  rewriteFfmpegArgs,
} from './ffmpeg-encoder'

const ENCODER_LIST = `
Encoders:
 V..... = Video
 A..... = Audio
 ------
 V....D mpeg4                MPEG-4 part 2
 V....D h264_videotoolbox    VideoToolbox H.264 Encoder
 A....D aac                  AAC (Advanced Audio Coding)
`

describe('parseEncoderNames', () => {
  it('extracts encoder ids from ffmpeg -encoders output', () => {
    expect(parseEncoderNames(ENCODER_LIST)).toEqual([
      'mpeg4',
      'h264_videotoolbox',
      'aac',
    ])
  })
})

describe('pickLgplH264Encoder', () => {
  it('prefers libopenh264 when it is available', () => {
    expect(
      pickLgplH264Encoder(['mpeg4', 'libopenh264', 'h264_videotoolbox']),
    ).toBe('libopenh264')
  })

  it('falls back to VideoToolbox on macOS LGPL builds', () => {
    expect(pickLgplH264Encoder(['mpeg4', 'h264_videotoolbox', 'aac'])).toBe(
      'h264_videotoolbox',
    )
  })

  it('throws when only GPL encoders would work', () => {
    expect(() => pickLgplH264Encoder(['mpeg4', 'aac'])).toThrow(
      'LGPL-compatible H.264 encoder',
    )
  })
})

describe('rewriteFfmpegArgs', () => {
  it('replaces Patchwork libx264 with an LGPL encoder', () => {
    expect(
      rewriteFfmpegArgs(
        ['-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p'],
        'h264_videotoolbox',
      ),
    ).toEqual([
      '-c:v',
      'h264_videotoolbox',
      '-c:a',
      'aac',
      '-pix_fmt',
      'yuv420p',
    ])
  })
})

describe('resolvePatchworkBinary', () => {
  it('maps ffmpeg and ffprobe names to bundled absolute paths', () => {
    expect(
      resolvePatchworkBinary('ffmpeg', '/app/ffmpeg', '/app/ffprobe'),
    ).toBe('/app/ffmpeg')
    expect(
      resolvePatchworkBinary('ffprobe', '/app/ffmpeg', '/app/ffprobe'),
    ).toBe('/app/ffprobe')
    expect(resolvePatchworkBinary('swift', '/app/ffmpeg', '/app/ffprobe')).toBe(
      'swift',
    )
  })
})
