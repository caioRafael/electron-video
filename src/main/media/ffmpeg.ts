import { assertLgplConfiguration, parseBinaryVersion } from './license'
import { runProcess } from './process'

export async function getFFmpegVersion(ffmpegPath: string): Promise<string> {
  const result = await runProcess(ffmpegPath, ['-version'])

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || 'ffmpeg -version failed')
  }

  const output = `${result.stdout}\n${result.stderr}`
  assertLgplConfiguration(output)

  const version = parseBinaryVersion(output)

  if (!version) {
    throw new Error('Unable to parse ffmpeg version')
  }

  return version
}
