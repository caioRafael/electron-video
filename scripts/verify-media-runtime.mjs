import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const platformKey = `${process.platform}-${process.arch}`
const extension = process.platform === 'win32' ? '.exe' : ''
const ffmpegPath = path.join(
  ROOT_DIR,
  'resources',
  'ffmpeg',
  platformKey,
  `ffmpeg${extension}`,
)
const ffprobePath = path.join(
  ROOT_DIR,
  'resources',
  'ffmpeg',
  platformKey,
  `ffprobe${extension}`,
)

function run(binaryPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 })
    })
  })
}

function assertLgpl(output, label) {
  const configuration = output
    .split('\n')
    .find((line) => line.trim().startsWith('configuration:'))

  if (!configuration) {
    throw new Error(`${label} did not report a configuration line`)
  }

  if (configuration.includes('--enable-gpl')) {
    throw new Error(`${label} enables GPL components`)
  }

  if (configuration.includes('--enable-nonfree')) {
    throw new Error(`${label} enables nonfree components`)
  }
}

async function probe(filePath) {
  const result = await run(ffprobePath, [
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
    throw new Error(result.stderr || `ffprobe failed for ${filePath}`)
  }

  return JSON.parse(result.stdout)
}

function findStream(probeResult, codecType) {
  return probeResult.streams?.find((stream) => stream.codec_type === codecType)
}

async function main() {
  console.log(`ffmpeg: ${ffmpegPath}`)
  console.log(`ffprobe: ${ffprobePath}`)

  const ffmpegVersion = await run(ffmpegPath, ['-version'])
  const ffprobeVersion = await run(ffprobePath, ['-version'])

  if (ffmpegVersion.exitCode !== 0 || ffprobeVersion.exitCode !== 0) {
    throw new Error('Unable to read bundled FFmpeg/FFprobe versions')
  }

  assertLgpl(`${ffmpegVersion.stdout}\n${ffmpegVersion.stderr}`, 'ffmpeg')
  assertLgpl(`${ffprobeVersion.stdout}\n${ffprobeVersion.stderr}`, 'ffprobe')

  const ffmpegMatch = ffmpegVersion.stdout.match(/version\s+(\S+)/i)
  const ffprobeMatch = ffprobeVersion.stdout.match(/version\s+(\S+)/i)

  console.log(`ffmpeg version: ${ffmpegMatch?.[1] ?? 'unknown'}`)
  console.log(`ffprobe version: ${ffprobeMatch?.[1] ?? 'unknown'}`)

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'video-lab-media-'))

  try {
    const imagePath = path.join(tempDir, 'image.png')
    const videoPath = path.join(tempDir, 'video.mp4')
    const audioPath = path.join(tempDir, 'audio.wav')

    const image = await run(ffmpegPath, [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=red:s=320x240:d=1',
      '-frames:v',
      '1',
      imagePath,
    ])
    const video = await run(ffmpegPath, [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=duration=1:size=640x360:rate=30',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=1000:duration=1',
      '-pix_fmt',
      'yuv420p',
      videoPath,
    ])
    const audio = await run(ffmpegPath, [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=1',
      audioPath,
    ])

    if (image.exitCode !== 0 || video.exitCode !== 0 || audio.exitCode !== 0) {
      throw new Error('Failed to generate validation media with bundled ffmpeg')
    }

    const imageProbe = await probe(imagePath)
    const videoProbe = await probe(videoPath)
    const audioProbe = await probe(audioPath)
    const imageStream = findStream(imageProbe, 'video')
    const videoStream = findStream(videoProbe, 'video')
    const audioStream = findStream(audioProbe, 'audio')

    if (!imageStream?.width || !imageStream.height) {
      throw new Error('Image metadata is incomplete')
    }

    if (
      !videoStream?.width ||
      !videoStream.height ||
      !videoStream.codec_name ||
      !videoProbe.format?.duration
    ) {
      throw new Error('Video metadata is incomplete')
    }

    if (
      !audioStream?.sample_rate ||
      !audioStream.channels ||
      !audioStream.codec_name ||
      !audioProbe.format?.duration
    ) {
      throw new Error('Audio metadata is incomplete')
    }

    console.log(
      `image: ${imageStream.width}x${imageStream.height} ${imageProbe.format.format_name}`,
    )
    console.log(
      `video: ${videoStream.width}x${videoStream.height} ${videoStream.codec_name} ${videoProbe.format.duration}s`,
    )
    console.log(
      `audio: ${audioStream.sample_rate}Hz ${audioStream.channels}ch ${audioStream.codec_name} ${audioProbe.format.duration}s`,
    )
    console.log('Media runtime validation passed')
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
