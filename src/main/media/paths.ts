import { app } from 'electron'
import { accessSync, chmodSync, constants } from 'node:fs'
import path from 'node:path'
import { MediaPlatformKey } from '../../shared/media'

const PLATFORM_KEYS: readonly MediaPlatformKey[] = [
  'darwin-arm64',
  'darwin-x64',
  'win32-x64',
  'win32-arm64',
  'linux-x64',
  'linux-arm64',
]

function isMediaPlatformKey(value: string): value is MediaPlatformKey {
  return PLATFORM_KEYS.includes(value as MediaPlatformKey)
}

export function getMediaPlatformKey(
  platform = process.platform,
  arch = process.arch,
): MediaPlatformKey {
  const key = `${platform}-${arch}`

  if (!isMediaPlatformKey(key)) {
    throw new Error(`Unsupported media platform: ${key}`)
  }

  return key
}

function getBinariesDirectory(): string {
  const platformKey = getMediaPlatformKey()

  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'ffmpeg', platformKey)
  }

  return path.join(__dirname, '../../resources/ffmpeg', platformKey)
}

function getBinaryName(name: 'ffmpeg' | 'ffprobe'): string {
  return process.platform === 'win32' ? `${name}.exe` : name
}

function ensureExecutable(filePath: string): void {
  try {
    accessSync(filePath, constants.X_OK)
    return
  } catch {
    if (process.platform === 'win32') {
      throw new Error(`Media binary is not executable: ${filePath}`)
    }
  }

  try {
    chmodSync(filePath, 0o755)
    accessSync(filePath, constants.X_OK)
  } catch {
    throw new Error(`Media binary is not executable: ${filePath}`)
  }
}

function resolveBinaryPath(name: 'ffmpeg' | 'ffprobe'): string {
  const binaryPath = path.join(getBinariesDirectory(), getBinaryName(name))

  try {
    accessSync(binaryPath, constants.F_OK)
  } catch {
    throw new Error(
      `Bundled ${name} was not found at ${binaryPath}. Run pnpm prepare:ffmpeg.`,
    )
  }

  ensureExecutable(binaryPath)

  return binaryPath
}

export function getFFmpegPath(): string {
  return resolveBinaryPath('ffmpeg')
}

export function getFFprobePath(): string {
  return resolveBinaryPath('ffprobe')
}
