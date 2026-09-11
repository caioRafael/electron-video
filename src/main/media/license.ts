export function assertLgplConfiguration(versionOutput: string): void {
  const configuration = versionOutput
    .split('\n')
    .find((line) => line.trim().startsWith('configuration:'))

  if (!configuration) {
    return
  }

  if (configuration.includes('--enable-gpl')) {
    throw new Error('Bundled FFmpeg enables GPL components')
  }

  if (configuration.includes('--enable-nonfree')) {
    throw new Error('Bundled FFmpeg enables nonfree components')
  }
}

export function parseBinaryVersion(output: string): string | null {
  const match = output.match(/version\s+(\S+)/i)
  return match?.[1] ?? null
}
