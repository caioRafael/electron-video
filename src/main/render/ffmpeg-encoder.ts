const LGPL_H264_ENCODERS = [
  'libopenh264',
  'h264_videotoolbox',
  'h264_nvenc',
  'h264_amf',
  'h264_qsv',
] as const

export function parseEncoderNames(output: string): string[] {
  const names: string[] = []

  for (const line of output.split('\n')) {
    const match = line.match(/^\s*[VASD][.A-Z]+\s+(\S+)/)
    const name = match?.[1]

    if (name && /^[A-Za-z0-9_]+$/.test(name)) {
      names.push(name)
    }
  }

  return names
}

export function pickLgplH264Encoder(encoderNames: string[]): string {
  const available = new Set(encoderNames)

  for (const encoder of LGPL_H264_ENCODERS) {
    if (available.has(encoder)) {
      return encoder
    }
  }

  throw new Error(
    'Bundled FFmpeg has no LGPL-compatible H.264 encoder. libx264 is GPL and is not shipped.',
  )
}

export function rewriteFfmpegArgs(
  args: readonly string[],
  encoder: string,
): string[] {
  return args.map((arg) => {
    return arg === 'libx264' ? encoder : arg
  })
}

export function resolvePatchworkBinary(
  command: unknown,
  ffmpegPath: string,
  ffprobePath: string,
): unknown {
  if (command === 'ffmpeg' || command === 'ffmpeg.exe') {
    return ffmpegPath
  }

  if (command === 'ffprobe' || command === 'ffprobe.exe') {
    return ffprobePath
  }

  return command
}
