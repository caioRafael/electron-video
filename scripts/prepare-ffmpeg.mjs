import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import {
  chmod,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const FFMPEG_VERSION = 'n8.1'
const FFMPEG_SOURCE_URL = `https://github.com/FFmpeg/FFmpeg/archive/refs/tags/${FFMPEG_VERSION}.tar.gz`
const BTBN_RELEASE = 'latest'
const BTBN_BASE = `https://github.com/BtbN/FFmpeg-Builds/releases/download/${BTBN_RELEASE}`

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BINARIES_DIR = path.join(ROOT_DIR, 'resources', 'ffmpeg')
const CACHE_DIR = path.join(ROOT_DIR, '.cache', 'ffmpeg')
const LICENSES_DIR = path.join(ROOT_DIR, 'licenses', 'ffmpeg')

const PLATFORM_TARGETS = {
  'darwin-arm64': { kind: 'compile', arch: 'arm64' },
  'darwin-x64': { kind: 'compile', arch: 'x86_64' },
  'win32-x64': {
    kind: 'download',
    file: 'ffmpeg-n8.1-latest-win64-lgpl-8.1.zip',
    ffmpeg: 'ffmpeg.exe',
    ffprobe: 'ffprobe.exe',
  },
  'win32-arm64': {
    kind: 'download',
    file: 'ffmpeg-n8.1-latest-winarm64-lgpl-8.1.zip',
    ffmpeg: 'ffmpeg.exe',
    ffprobe: 'ffprobe.exe',
  },
  'linux-x64': {
    kind: 'download',
    file: 'ffmpeg-n8.1-latest-linux64-lgpl-8.1.tar.xz',
    ffmpeg: 'ffmpeg',
    ffprobe: 'ffprobe',
  },
  'linux-arm64': {
    kind: 'download',
    file: 'ffmpeg-n8.1-latest-linuxarm64-lgpl-8.1.tar.xz',
    ffmpeg: 'ffmpeg',
    ffprobe: 'ffprobe',
  },
}

function getCurrentPlatformKey() {
  return `${process.platform}-${process.arch}`
}

function log(message) {
  console.log(`[prepare-ffmpeg] ${message}`)
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}

function runCaptured(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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

async function pathExists(targetPath) {
  try {
    await stat(targetPath)
    return true
  } catch {
    return false
  }
}

async function walkFiles(directoryPath) {
  const files = []
  const entries = await readdir(directoryPath, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(entryPath)))
      continue
    }

    if (entry.isFile()) {
      files.push(entryPath)
    }
  }

  return files
}

function assertLgplConfiguration(output) {
  const configuration = output
    .split('\n')
    .find((line) => line.trim().startsWith('configuration:'))

  if (!configuration) {
    return
  }

  if (configuration.includes('--enable-gpl')) {
    throw new Error('Refusing to use a GPL FFmpeg build')
  }

  if (configuration.includes('--enable-nonfree')) {
    throw new Error('Refusing to use a nonfree FFmpeg build')
  }
}

async function binariesExist(platformKey) {
  const target = PLATFORM_TARGETS[platformKey]
  const directory = path.join(BINARIES_DIR, platformKey)
  const ffmpegPath = path.join(directory, target.ffmpeg ?? 'ffmpeg')
  const ffprobePath = path.join(directory, target.ffprobe ?? 'ffprobe')

  return (await pathExists(ffmpegPath)) && (await pathExists(ffprobePath))
}

async function verifyLocalBinaries(platformKey) {
  if (process.platform !== platformKey.split('-')[0]) {
    return
  }

  const target = PLATFORM_TARGETS[platformKey]
  const directory = path.join(BINARIES_DIR, platformKey)
  const ffmpegPath = path.join(directory, target.ffmpeg ?? 'ffmpeg')
  const ffprobePath = path.join(directory, target.ffprobe ?? 'ffprobe')

  for (const binaryPath of [ffmpegPath, ffprobePath]) {
    const result = await runCaptured(binaryPath, ['-version'])

    if (result.exitCode !== 0) {
      throw new Error(`${path.basename(binaryPath)} -version failed`)
    }

    assertLgplConfiguration(`${result.stdout}\n${result.stderr}`)
  }
}

async function downloadFile(url, destinationPath) {
  if (await pathExists(destinationPath)) {
    return
  }

  await mkdir(path.dirname(destinationPath), { recursive: true })
  log(`Downloading ${url}`)

  const response = await fetch(url)

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.status}`)
  }

  await pipeline(response.body, createWriteStream(destinationPath))
}

async function sha256File(filePath) {
  const hash = createHash('sha256')
  hash.update(await readFile(filePath))
  return hash.digest('hex')
}

async function verifyChecksum(archivePath, archiveName) {
  const checksumPath = path.join(CACHE_DIR, 'checksums.sha256')
  await downloadFile(`${BTBN_BASE}/checksums.sha256`, checksumPath)

  const checksums = await readFile(checksumPath, 'utf8')
  const line = checksums.split('\n').find((item) => item.includes(archiveName))

  if (!line) {
    throw new Error(`No checksum found for ${archiveName}`)
  }

  const expected = line.trim().split(/\s+/)[0]
  const actual = await sha256File(archivePath)

  if (expected !== actual) {
    throw new Error(`Checksum mismatch for ${archiveName}`)
  }
}

async function extractArchive(archivePath, destinationPath) {
  await rm(destinationPath, { recursive: true, force: true })
  await mkdir(destinationPath, { recursive: true })

  if (archivePath.endsWith('.zip')) {
    await run('unzip', ['-q', archivePath, '-d', destinationPath])
    return
  }

  await run('tar', ['-xf', archivePath, '-C', destinationPath])
}

async function findBinary(directoryPath, binaryName) {
  const files = await walkFiles(directoryPath)
  const match = files.find((filePath) => path.basename(filePath) === binaryName)

  if (!match) {
    throw new Error(`Could not find ${binaryName} in ${directoryPath}`)
  }

  return match
}

async function copyLicenseFiles(extractedPath, platformKey) {
  const destination = path.join(LICENSES_DIR, 'vendor', platformKey)
  await mkdir(destination, { recursive: true })

  const files = await walkFiles(extractedPath)
  const licenseFiles = files.filter((filePath) => {
    const name = path.basename(filePath).toLowerCase()
    return (
      name.startsWith('copying') ||
      name.startsWith('license') ||
      name.startsWith('notice') ||
      name.includes('third-party')
    )
  })

  for (const filePath of licenseFiles) {
    await copyFile(filePath, path.join(destination, path.basename(filePath)))
  }
}

async function writeManifest(platformKey, extra) {
  const destination = path.join(BINARIES_DIR, platformKey, 'manifest.json')

  await writeFile(
    destination,
    JSON.stringify(
      {
        platform: platformKey,
        ffmpegVersion: FFMPEG_VERSION,
        preparedAt: new Date().toISOString(),
        ...extra,
      },
      null,
      2,
    ),
    'utf8',
  )
}

async function installBinary(sourcePath, destinationPath) {
  await mkdir(path.dirname(destinationPath), { recursive: true })
  await copyFile(sourcePath, destinationPath)

  if (process.platform !== 'win32') {
    await chmod(destinationPath, 0o755)
  }
}

async function prepareDownload(platformKey) {
  const target = PLATFORM_TARGETS[platformKey]
  const archivePath = path.join(CACHE_DIR, target.file)
  const extractedPath = path.join(CACHE_DIR, `extract-${platformKey}`)

  await downloadFile(`${BTBN_BASE}/${target.file}`, archivePath)
  await verifyChecksum(archivePath, target.file)
  await extractArchive(archivePath, extractedPath)

  const ffmpegSource = await findBinary(extractedPath, target.ffmpeg)
  const ffprobeSource = await findBinary(extractedPath, target.ffprobe)
  const outputDir = path.join(BINARIES_DIR, platformKey)

  await installBinary(ffmpegSource, path.join(outputDir, target.ffmpeg))
  await installBinary(ffprobeSource, path.join(outputDir, target.ffprobe))
  await copyLicenseFiles(extractedPath, platformKey)
  await writeManifest(platformKey, {
    source: `${BTBN_BASE}/${target.file}`,
    license: 'LGPLv3',
    provider: 'BtbN/FFmpeg-Builds',
    variant: 'lgpl',
    configure: '--enable-version3 --disable-debug',
  })
}

async function downloadFfmpegSource() {
  const archivePath = path.join(CACHE_DIR, `${FFMPEG_VERSION}.tar.gz`)
  const sourceDir = path.join(CACHE_DIR, `FFmpeg-${FFMPEG_VERSION}`)

  await downloadFile(FFMPEG_SOURCE_URL, archivePath)

  if (!(await pathExists(sourceDir))) {
    await run('tar', ['-xzf', archivePath, '-C', CACHE_DIR])
  }

  if (!(await pathExists(path.join(sourceDir, 'configure')))) {
    throw new Error('FFmpeg source archive did not contain configure')
  }

  return sourceDir
}

async function prepareCompile(platformKey) {
  if (process.platform !== 'darwin') {
    throw new Error(`macOS binaries must be compiled on macOS (${platformKey})`)
  }

  const target = PLATFORM_TARGETS[platformKey]
  const sourceDir = await downloadFfmpegSource()
  const buildDir = path.join(CACHE_DIR, `build-${platformKey}`)
  const documentedConfigure = [
    '--enable-static',
    '--disable-shared',
    '--disable-debug',
    '--disable-doc',
    '--disable-ffplay',
    '--enable-ffmpeg',
    '--enable-ffprobe',
  ]
  const configureArgs = [
    `--prefix=${path.join(buildDir, 'prefix')}`,
    ...documentedConfigure,
  ]

  if (target.arch !== os.arch() && target.arch !== process.arch) {
    configureArgs.push(
      '--enable-cross-compile',
      `--arch=${target.arch}`,
      '--target-os=darwin',
    )
  }

  await rm(buildDir, { recursive: true, force: true })
  await mkdir(buildDir, { recursive: true })

  log(`Configuring official FFmpeg ${FFMPEG_VERSION} for ${platformKey}`)
  await run(path.join(sourceDir, 'configure'), configureArgs, {
    cwd: buildDir,
  })
  await run('make', [`-j${os.availableParallelism?.() ?? os.cpus().length}`], {
    cwd: buildDir,
  })

  const ffmpegSource = path.join(buildDir, 'ffmpeg')
  const ffprobeSource = path.join(buildDir, 'ffprobe')
  const outputDir = path.join(BINARIES_DIR, platformKey)

  await installBinary(ffmpegSource, path.join(outputDir, 'ffmpeg'))
  await installBinary(ffprobeSource, path.join(outputDir, 'ffprobe'))
  await copyFile(
    path.join(sourceDir, 'COPYING.LGPLv2.1'),
    path.join(LICENSES_DIR, 'COPYING.LGPLv2.1'),
  )
  await copyFile(
    path.join(sourceDir, 'LICENSE.md'),
    path.join(LICENSES_DIR, 'LICENSE.md'),
  )
  await writeManifest(platformKey, {
    source: FFMPEG_SOURCE_URL,
    license: 'LGPLv2.1+',
    provider: 'FFmpeg official source',
    configure: documentedConfigure.join(' '),
  })
}

async function preparePlatform(platformKey) {
  const target = PLATFORM_TARGETS[platformKey]

  if (!target) {
    throw new Error(`Unsupported platform: ${platformKey}`)
  }

  if (await binariesExist(platformKey)) {
    log(`${platformKey} binaries already exist`)
    await verifyLocalBinaries(platformKey)
    return
  }

  log(`Preparing ${platformKey}`)

  if (target.kind === 'compile') {
    await prepareCompile(platformKey)
  } else {
    await prepareDownload(platformKey)
  }

  await verifyLocalBinaries(platformKey)
  log(`${platformKey} ready`)
}

function parsePlatforms(argv) {
  if (argv.includes('--all')) {
    return Object.keys(PLATFORM_TARGETS)
  }

  const platformIndex = argv.indexOf('--platform')

  if (platformIndex >= 0) {
    const platform = argv[platformIndex + 1]

    if (!platform || platform.startsWith('--')) {
      throw new Error('Missing value for --platform')
    }

    if (platform === 'current') {
      return [getCurrentPlatformKey()]
    }

    return [platform]
  }

  return [getCurrentPlatformKey()]
}

async function main() {
  const platforms = parsePlatforms(process.argv.slice(2))

  await mkdir(CACHE_DIR, { recursive: true })
  await mkdir(BINARIES_DIR, { recursive: true })
  await mkdir(LICENSES_DIR, { recursive: true })

  for (const platformKey of platforms) {
    await preparePlatform(platformKey)
  }
}

main().catch((error) => {
  console.error(`[prepare-ffmpeg] ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
