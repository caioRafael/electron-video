import { assertLgplConfiguration, parseBinaryVersion } from './license'
import { getFFprobePath } from './paths'
import { runProcess } from './process'

export interface FFprobeStream {
  codec_type?: string
  codec_name?: string
  width?: number
  height?: number
  duration?: string
  r_frame_rate?: string
  avg_frame_rate?: string
  sample_rate?: string
  channels?: number
}

export interface FFprobeFormat {
  format_name?: string
  duration?: string
}

export interface FFprobeOutput {
  streams?: FFprobeStream[]
  format?: FFprobeFormat
}

export async function getFFprobeVersion(ffprobePath: string): Promise<string> {
  const result = await runProcess(ffprobePath, ['-version'])

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || 'ffprobe -version failed')
  }

  const output = `${result.stdout}\n${result.stderr}`
  assertLgplConfiguration(output)

  const version = parseBinaryVersion(output)

  if (!version) {
    throw new Error('Unable to parse ffprobe version')
  }

  return version
}

export async function probeMediaFile(filePath: string): Promise<FFprobeOutput> {
  const result = await runProcess(getFFprobePath(), [
    '-v',
    'error',
    '-hide_banner',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    '--',
    filePath,
  ])

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || 'ffprobe failed')
  }

  const parsed: unknown = JSON.parse(result.stdout)

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('ffprobe returned invalid JSON')
  }

  return parsed as FFprobeOutput
}
