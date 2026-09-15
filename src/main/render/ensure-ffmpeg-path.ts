import {
  spawn,
  spawnSync,
  type SpawnOptions,
  type SpawnSyncOptions,
} from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { getFFmpegPath, getFFprobePath } from '../media/paths'
import { runProcess } from '../media/process'
import {
  parseEncoderNames,
  pickLgplH264Encoder,
  resolvePatchworkBinary,
  rewriteFfmpegArgs,
} from './ffmpeg-encoder'

interface SpawnModule {
  spawn: typeof spawn
  spawnSync: typeof spawnSync
}

let spawnHooksInstalled = false
let currentVideoEncoder = 'libopenh264'

function prependFfmpegDirectoryToPath(ffmpegPath: string): void {
  const ffmpegDirectory = path.dirname(ffmpegPath)
  const currentPath = process.env.PATH ?? ''
  const pathParts = currentPath.split(path.delimiter).filter(Boolean)

  if (pathParts[0] === ffmpegDirectory) {
    return
  }

  process.env.PATH = [ffmpegDirectory, ...pathParts].join(path.delimiter)
}

function getSpawnModule(): SpawnModule {
  return createRequire(__filename)('node:child_process') as SpawnModule
}

function installSpawnHooks(ffmpegPath: string, ffprobePath: string): void {
  const spawnModule = getSpawnModule()
  const originalSpawn = spawnModule.spawn
  const originalSpawnSync = spawnModule.spawnSync

  function nextCommand(command: unknown): string {
    return String(resolvePatchworkBinary(command, ffmpegPath, ffprobePath))
  }

  spawnModule.spawn = ((
    command: string,
    args?: string[] | SpawnOptions,
    options?: SpawnOptions,
  ) => {
    const binary = nextCommand(command)

    if (Array.isArray(args)) {
      const nextArgs = rewriteFfmpegArgs(args, currentVideoEncoder)

      if (options === undefined) {
        return originalSpawn(binary, nextArgs)
      }

      return originalSpawn(binary, nextArgs, options)
    }

    if (args === undefined) {
      return originalSpawn(binary)
    }

    return originalSpawn(binary, args)
  }) as typeof originalSpawn

  spawnModule.spawnSync = ((
    command: string,
    args?: string[] | SpawnSyncOptions,
    options?: SpawnSyncOptions,
  ) => {
    const binary = nextCommand(command)

    if (Array.isArray(args)) {
      const nextArgs = rewriteFfmpegArgs(args, currentVideoEncoder)

      if (options === undefined) {
        return originalSpawnSync(binary, nextArgs)
      }

      return originalSpawnSync(binary, nextArgs, options)
    }

    if (args === undefined) {
      return originalSpawnSync(binary)
    }

    return originalSpawnSync(binary, args)
  }) as typeof originalSpawnSync
}

export async function ensureFfmpegOnPath(): Promise<void> {
  const ffmpegPath = getFFmpegPath()
  const ffprobePath = getFFprobePath()
  const encoderList = await runProcess(ffmpegPath, [
    '-hide_banner',
    '-encoders',
  ])

  if (encoderList.exitCode !== 0) {
    throw new Error(encoderList.stderr || 'Failed to list FFmpeg encoders')
  }

  currentVideoEncoder = pickLgplH264Encoder(
    parseEncoderNames(`${encoderList.stdout}\n${encoderList.stderr}`),
  )
  prependFfmpegDirectoryToPath(ffmpegPath)

  if (spawnHooksInstalled) {
    return
  }

  installSpawnHooks(ffmpegPath, ffprobePath)
  spawnHooksInstalled = true
}
