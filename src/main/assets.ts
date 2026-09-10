import { BrowserWindow, dialog, nativeImage, OpenDialogOptions } from 'electron'
import { randomUUID } from 'node:crypto'
import { copyFile, mkdir, readdir, rename, stat } from 'node:fs/promises'
import path from 'node:path'
import {
  ASSET_DIRECTORIES,
  ASSETS_DIRECTORY,
  Asset,
  AssetKind,
  EMPTY_WORKSPACE_ASSETS,
  ImportAssetsResult,
  WorkspaceAssets,
} from '../shared/assets'
import { pathExists } from './fs'

const AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'aac',
  'flac',
  'ogg',
  'm4a',
  'wma',
  'aiff',
  'aif',
  'opus',
]

const VIDEO_EXTENSIONS = [
  'mp4',
  'mov',
  'avi',
  'mkv',
  'webm',
  'm4v',
  'wmv',
  'mpg',
  'mpeg',
]

const IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'tiff',
  'tif',
  'heic',
  'avif',
  'svg',
]

const AUDIO_EXTENSION_SET = new Set(AUDIO_EXTENSIONS)
const VIDEO_EXTENSION_SET = new Set(VIDEO_EXTENSIONS)
const IMAGE_EXTENSION_SET = new Set(IMAGE_EXTENSIONS)
const PREVIEW_MAX_SIZE = 320
const previewCache = new Map<string, string | null>()

function isAssetKind(value: unknown): value is AssetKind {
  return value === 'audio' || value === 'video' || value === 'image'
}

function getExtension(filePath: string): string {
  return path.extname(filePath).slice(1).toLowerCase()
}

function getAssetKind(filePath: string): AssetKind | null {
  const extension = getExtension(filePath)

  if (AUDIO_EXTENSION_SET.has(extension)) {
    return 'audio'
  }

  if (VIDEO_EXTENSION_SET.has(extension)) {
    return 'video'
  }

  if (IMAGE_EXTENSION_SET.has(extension)) {
    return 'image'
  }

  return null
}

function getAssetDirectory(workspacePath: string, kind: AssetKind): string {
  return path.join(workspacePath, ASSETS_DIRECTORY, ASSET_DIRECTORIES[kind])
}

function isInsideDirectory(targetPath: string, directoryPath: string): boolean {
  const relative = path.relative(
    path.resolve(directoryPath),
    path.resolve(targetPath),
  )

  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}

function hasInvalidAssetNameChars(value: string): boolean {
  return value.includes('\0') || /[\\/:*?"<>|]/.test(value)
}

function isWorkspaceAssetFile(
  workspacePath: string,
  assetPath: string,
): boolean {
  const resolvedAssetPath = path.resolve(assetPath)

  return Object.values(ASSET_DIRECTORIES).some((folder) => {
    const directoryPath = path.resolve(workspacePath, ASSETS_DIRECTORY, folder)

    return (
      resolvedAssetPath !== directoryPath &&
      isInsideDirectory(resolvedAssetPath, directoryPath)
    )
  })
}

function buildRenamedFilename(currentName: string, nextName: string): string {
  const current = path.parse(currentName)
  const sanitized = path.basename(nextName.trim())

  if (!sanitized || sanitized === '.' || sanitized === '..') {
    throw new Error('Invalid asset name')
  }

  if (hasInvalidAssetNameChars(sanitized)) {
    throw new Error('Invalid asset name')
  }

  const parsedNext = path.parse(sanitized)
  const baseName =
    parsedNext.ext.toLowerCase() === current.ext.toLowerCase()
      ? parsedNext.name
      : sanitized

  if (
    !baseName ||
    baseName.startsWith('.') ||
    hasInvalidAssetNameChars(baseName)
  ) {
    throw new Error('Invalid asset name')
  }

  return `${baseName}${current.ext}`
}

async function renameAssetFile(
  currentPath: string,
  nextPath: string,
): Promise<void> {
  if (currentPath === nextPath) {
    return
  }

  if (currentPath.toLowerCase() === nextPath.toLowerCase()) {
    const temporaryPath = `${nextPath}.${randomUUID()}.tmp`
    await rename(currentPath, temporaryPath)
    await rename(temporaryPath, nextPath)
    return
  }

  if (await pathExists(nextPath)) {
    throw new Error('Asset name already exists')
  }

  await rename(currentPath, nextPath)
}

async function collectFilesFromDirectory(
  directoryPath: string,
): Promise<string[]> {
  const files: string[] = []
  const dirents = await readdir(directoryPath, { withFileTypes: true })

  for (const dirent of dirents) {
    if (dirent.name.startsWith('.')) {
      continue
    }

    const entryPath = path.join(directoryPath, dirent.name)

    if (dirent.isDirectory()) {
      files.push(...(await collectFilesFromDirectory(entryPath)))
      continue
    }

    if (dirent.isFile()) {
      files.push(entryPath)
    }
  }

  return files
}

async function collectSourceFiles(filePaths: string[]): Promise<string[]> {
  const files: string[] = []

  for (const filePath of filePaths) {
    if (!(await pathExists(filePath))) {
      continue
    }

    const fileStat = await stat(filePath)

    if (fileStat.isDirectory()) {
      files.push(...(await collectFilesFromDirectory(filePath)))
      continue
    }

    if (fileStat.isFile()) {
      files.push(filePath)
    }
  }

  return files
}

function getDialogTitle(kind?: AssetKind): string {
  if (kind === 'audio') {
    return 'Selecione arquivos de áudio'
  }

  if (kind === 'video') {
    return 'Selecione arquivos de vídeo'
  }

  if (kind === 'image') {
    return 'Selecione imagens'
  }

  return 'Selecione os arquivos de mídia'
}

function getDialogFilters(kind?: AssetKind): OpenDialogOptions['filters'] {
  if (kind === 'audio') {
    return [{ name: 'Áudio', extensions: AUDIO_EXTENSIONS }]
  }

  if (kind === 'video') {
    return [{ name: 'Vídeo', extensions: VIDEO_EXTENSIONS }]
  }

  if (kind === 'image') {
    return [{ name: 'Imagens', extensions: IMAGE_EXTENSIONS }]
  }

  return [
    {
      name: 'Mídia',
      extensions: [
        ...AUDIO_EXTENSIONS,
        ...VIDEO_EXTENSIONS,
        ...IMAGE_EXTENSIONS,
      ],
    },
    { name: 'Áudio', extensions: AUDIO_EXTENSIONS },
    { name: 'Vídeo', extensions: VIDEO_EXTENSIONS },
    { name: 'Imagens', extensions: IMAGE_EXTENSIONS },
  ]
}

async function getUniqueDestination(
  directoryPath: string,
  filename: string,
): Promise<string> {
  const parsed = path.parse(filename)
  let candidate = path.join(directoryPath, filename)
  let counter = 1

  while (await pathExists(candidate)) {
    candidate = path.join(
      directoryPath,
      `${parsed.name}-${counter}${parsed.ext}`,
    )
    counter += 1
  }

  return candidate
}

async function listAssetsInDirectory(
  directoryPath: string,
  kind: AssetKind,
): Promise<Asset[]> {
  if (!(await pathExists(directoryPath))) {
    return []
  }

  const dirents = await readdir(directoryPath, { withFileTypes: true })
  const assets: Asset[] = []

  for (const dirent of dirents) {
    if (!dirent.isFile() || dirent.name.startsWith('.')) {
      continue
    }

    assets.push({
      name: dirent.name,
      path: path.join(directoryPath, dirent.name),
      kind,
    })
  }

  return assets.sort((left, right) => {
    return left.name.localeCompare(right.name, 'pt-BR')
  })
}

export async function ensureAssetFolders(workspacePath: string): Promise<void> {
  for (const folder of Object.values(ASSET_DIRECTORIES)) {
    await mkdir(path.join(workspacePath, ASSETS_DIRECTORY, folder), {
      recursive: true,
    })
  }
}

export async function listWorkspaceAssets(
  workspacePath: string,
): Promise<WorkspaceAssets> {
  if (!(await pathExists(workspacePath))) {
    return EMPTY_WORKSPACE_ASSETS
  }

  await ensureAssetFolders(workspacePath)

  return {
    audio: await listAssetsInDirectory(
      getAssetDirectory(workspacePath, 'audio'),
      'audio',
    ),
    videos: await listAssetsInDirectory(
      getAssetDirectory(workspacePath, 'video'),
      'video',
    ),
    images: await listAssetsInDirectory(
      getAssetDirectory(workspacePath, 'image'),
      'image',
    ),
  }
}

export async function importWorkspaceAssetPaths(
  workspacePath: string,
  filePaths: string[],
  kind?: AssetKind,
): Promise<ImportAssetsResult> {
  if (!(await pathExists(workspacePath))) {
    throw new Error('Workspace not found')
  }

  if (kind !== undefined && !isAssetKind(kind)) {
    throw new Error('Invalid asset kind')
  }

  if (
    !Array.isArray(filePaths) ||
    filePaths.some((filePath) => typeof filePath !== 'string')
  ) {
    throw new Error('Invalid file paths')
  }

  await ensureAssetFolders(workspacePath)

  const sourceFiles = await collectSourceFiles(filePaths)
  const imported: Asset[] = []
  const skipped: string[] = []
  const assetsDirectory = path.join(workspacePath, ASSETS_DIRECTORY)

  for (const filePath of sourceFiles) {
    const filename = path.basename(filePath)

    if (isInsideDirectory(filePath, assetsDirectory)) {
      continue
    }

    const assetKind = getAssetKind(filePath)

    if (!assetKind || (kind && assetKind !== kind)) {
      skipped.push(filename)
      continue
    }

    try {
      const destinationDirectory = getAssetDirectory(workspacePath, assetKind)
      const destinationPath = await getUniqueDestination(
        destinationDirectory,
        filename,
      )

      await copyFile(filePath, destinationPath)

      imported.push({
        name: path.basename(destinationPath),
        path: destinationPath,
        kind: assetKind,
      })
    } catch {
      skipped.push(filename)
    }
  }

  return {
    canceled: false,
    imported,
    skipped,
    assets: await listWorkspaceAssets(workspacePath),
  }
}

export async function importWorkspaceAssets(
  workspacePath: string,
  kind?: AssetKind,
): Promise<ImportAssetsResult> {
  if (kind !== undefined && !isAssetKind(kind)) {
    throw new Error('Invalid asset kind')
  }

  const dialogOptions: OpenDialogOptions = {
    title: getDialogTitle(kind),
    message: 'Você pode selecionar mais de um arquivo',
    properties: ['openFile', 'multiSelections'],
    filters: getDialogFilters(kind),
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 50)
  })

  const browserWindow = BrowserWindow.getFocusedWindow()
  const result = browserWindow
    ? await dialog.showOpenDialog(browserWindow, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions)

  if (result.canceled || result.filePaths.length === 0) {
    return {
      canceled: true,
      imported: [],
      skipped: [],
      assets: EMPTY_WORKSPACE_ASSETS,
    }
  }

  return importWorkspaceAssetPaths(workspacePath, result.filePaths, kind)
}

export async function renameWorkspaceAsset(
  workspacePath: string,
  assetPath: string,
  nextName: string,
): Promise<WorkspaceAssets> {
  if (typeof workspacePath !== 'string' || typeof assetPath !== 'string') {
    throw new Error('Invalid asset path')
  }

  if (typeof nextName !== 'string') {
    throw new Error('Invalid asset name')
  }

  if (!(await pathExists(workspacePath))) {
    throw new Error('Workspace not found')
  }

  const resolvedAssetPath = path.resolve(assetPath)

  if (!isWorkspaceAssetFile(workspacePath, resolvedAssetPath)) {
    throw new Error('Invalid asset path')
  }

  if (!(await pathExists(resolvedAssetPath))) {
    throw new Error('Asset not found')
  }

  const fileStat = await stat(resolvedAssetPath)

  if (!fileStat.isFile()) {
    throw new Error('Asset not found')
  }

  const currentName = path.basename(resolvedAssetPath)
  const nextFilename = buildRenamedFilename(currentName, nextName)
  const directoryPath = path.dirname(resolvedAssetPath)
  const nextPath = path.resolve(directoryPath, nextFilename)

  if (path.dirname(nextPath) !== directoryPath) {
    throw new Error('Invalid asset name')
  }

  await renameAssetFile(resolvedAssetPath, nextPath)
  previewCache.delete(resolvedAssetPath)

  return listWorkspaceAssets(workspacePath)
}

export async function getAssetPreview(
  workspacePath: string,
  assetPath: string,
): Promise<string | null> {
  if (typeof workspacePath !== 'string' || typeof assetPath !== 'string') {
    throw new Error('Invalid asset path')
  }

  const resolvedAssetPath = path.resolve(assetPath)

  if (!isWorkspaceAssetFile(workspacePath, resolvedAssetPath)) {
    throw new Error('Invalid asset path')
  }

  const kind = getAssetKind(resolvedAssetPath)

  if (kind !== 'image' && kind !== 'video') {
    return null
  }

  if (previewCache.has(resolvedAssetPath)) {
    return previewCache.get(resolvedAssetPath) ?? null
  }

  if (!(await pathExists(resolvedAssetPath))) {
    previewCache.set(resolvedAssetPath, null)
    return null
  }

  const preview = await createAssetPreview(resolvedAssetPath, kind)
  previewCache.set(resolvedAssetPath, preview)
  return preview
}

function resizePreview(image: Electron.NativeImage): Electron.NativeImage {
  const { width, height } = image.getSize()

  if (width <= 0 || height <= 0) {
    return image
  }

  if (width <= PREVIEW_MAX_SIZE && height <= PREVIEW_MAX_SIZE) {
    return image
  }

  if (width >= height) {
    return image.resize({ width: PREVIEW_MAX_SIZE })
  }

  return image.resize({ height: PREVIEW_MAX_SIZE })
}

async function createAssetPreview(
  assetPath: string,
  kind: 'image' | 'video',
): Promise<string | null> {
  if (kind === 'image') {
    const image = nativeImage.createFromPath(assetPath)

    if (!image.isEmpty()) {
      return resizePreview(image).toDataURL()
    }
  }

  try {
    const thumbnail = await nativeImage.createThumbnailFromPath(assetPath, {
      width: PREVIEW_MAX_SIZE,
      height: PREVIEW_MAX_SIZE,
    })

    if (!thumbnail.isEmpty()) {
      return resizePreview(thumbnail).toDataURL()
    }
  } catch {
    return null
  }

  return null
}
