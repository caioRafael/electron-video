import { BrowserWindow, dialog, nativeImage, OpenDialogOptions } from 'electron'
import { randomUUID } from 'node:crypto'
import { copyFile, mkdir, readdir, rename, stat } from 'node:fs/promises'
import path from 'node:path'
import { AssetMetadata } from '../shared/asset-metadata'
import {
  ASSET_DIRECTORIES,
  ASSETS_DIRECTORY,
  Asset,
  AssetKind,
  EMPTY_WORKSPACE_ASSETS,
  findAssetById,
  getAssetSource,
  ImportAssetsResult,
  isAssetKind,
  WorkspaceAssets,
} from '../shared/assets'
import {
  isInsideDirectory,
  isWorkspaceAssetFile,
  resolveAssetSource,
} from './asset-path'
import { pathExists } from './fs'
import { getMediaMetadata } from './media/metadata'
import {
  createWorkspaceMarker,
  readWorkspaceMarker,
  WorkspaceMarker,
  writeWorkspaceMarker,
} from './workspace-marker'

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

interface AssetFile {
  name: string
  kind: AssetKind
  source: string
}

function createAssetId(): string {
  return `asset_${randomUUID()}`
}

function createAsset(
  file: AssetFile,
  createdAt = new Date().toISOString(),
  metadata: AssetMetadata | null = null,
): Asset {
  return {
    id: createAssetId(),
    name: file.name,
    kind: file.kind,
    source: file.source,
    createdAt,
    metadata,
  }
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

function haveAssetsChanged(current: Asset[], next: Asset[]): boolean {
  if (current.length !== next.length) {
    return true
  }

  const currentById = new Map(current.map((asset) => [asset.id, asset]))

  return next.some((asset) => {
    const persisted = currentById.get(asset.id)

    if (!persisted) {
      return true
    }

    return (
      persisted.name !== asset.name ||
      persisted.kind !== asset.kind ||
      persisted.source !== asset.source ||
      persisted.createdAt !== asset.createdAt ||
      JSON.stringify(persisted.metadata) !== JSON.stringify(asset.metadata)
    )
  })
}

function groupAssetsByKind(assets: Asset[]): WorkspaceAssets {
  const grouped: WorkspaceAssets = {
    audio: [],
    videos: [],
    images: [],
  }

  for (const asset of assets) {
    if (asset.kind === 'audio') {
      grouped.audio.push(asset)
      continue
    }

    if (asset.kind === 'video') {
      grouped.videos.push(asset)
      continue
    }

    grouped.images.push(asset)
  }

  grouped.audio.sort((left, right) => {
    return left.name.localeCompare(right.name, 'pt-BR')
  })
  grouped.videos.sort((left, right) => {
    return left.name.localeCompare(right.name, 'pt-BR')
  })
  grouped.images.sort((left, right) => {
    return left.name.localeCompare(right.name, 'pt-BR')
  })

  return grouped
}

async function getOrCreateWorkspaceMarker(
  workspacePath: string,
): Promise<WorkspaceMarker> {
  const marker = await readWorkspaceMarker(workspacePath)

  if (marker) {
    return marker
  }

  return createWorkspaceMarker(randomUUID(), path.basename(workspacePath))
}

async function persistWorkspaceAssets(
  workspacePath: string,
  assets: Asset[],
): Promise<void> {
  const marker = await getOrCreateWorkspaceMarker(workspacePath)

  await writeWorkspaceMarker(workspacePath, {
    ...marker,
    assets,
  })
}

function findPersistedAsset(
  persistedBySource: Map<string, Asset>,
  file: AssetFile,
): Asset | undefined {
  const persisted = persistedBySource.get(file.source)

  if (!persisted || persisted.kind !== file.kind) {
    return undefined
  }

  return persisted
}

function hasInvalidAssetNameChars(value: string): boolean {
  return value.includes('\0') || /[\\/:*?"<>|]/.test(value)
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

async function listAssetFiles(
  workspacePath: string,
  kind: AssetKind,
): Promise<AssetFile[]> {
  const directoryPath = getAssetDirectory(workspacePath, kind)

  if (!(await pathExists(directoryPath))) {
    return []
  }

  const dirents = await readdir(directoryPath, { withFileTypes: true })
  const files: AssetFile[] = []

  for (const dirent of dirents) {
    if (!dirent.isFile() || dirent.name.startsWith('.')) {
      continue
    }

    files.push({
      name: dirent.name,
      kind,
      source: getAssetSource(kind, dirent.name),
    })
  }

  return files
}

async function listWorkspaceAssetFiles(
  workspacePath: string,
): Promise<AssetFile[]> {
  return [
    ...(await listAssetFiles(workspacePath, 'audio')),
    ...(await listAssetFiles(workspacePath, 'video')),
    ...(await listAssetFiles(workspacePath, 'image')),
  ]
}

async function ensureAssetsMetadata(
  workspacePath: string,
  assets: Asset[],
  missingMetadataIds: Set<string>,
  persistedIds: Set<string>,
): Promise<Asset[]> {
  const nextAssets: Asset[] = []

  for (const asset of assets) {
    const needsExtraction =
      !persistedIds.has(asset.id) || missingMetadataIds.has(asset.id)

    if (!needsExtraction) {
      nextAssets.push(asset)
      continue
    }

    try {
      const filePath = resolveAssetSource(workspacePath, asset.source)
      const metadata = await getMediaMetadata(filePath, asset.kind)
      nextAssets.push({
        ...asset,
        metadata,
      })
    } catch (error) {
      console.error('[assets] failed to extract metadata', error)
      nextAssets.push({
        ...asset,
        metadata: null,
      })
    }
  }

  return nextAssets
}

function syncAssetsWithFiles(
  persistedAssets: Asset[],
  files: AssetFile[],
): Asset[] {
  const persistedBySource = new Map<string, Asset>()

  for (const asset of persistedAssets) {
    if (!persistedBySource.has(asset.source)) {
      persistedBySource.set(asset.source, asset)
    }
  }

  return files.map((file) => {
    const persisted = findPersistedAsset(persistedBySource, file)

    if (persisted) {
      return {
        ...persisted,
        name: file.name,
        kind: file.kind,
        source: file.source,
      }
    }

    return createAsset(file)
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

  const marker = await getOrCreateWorkspaceMarker(workspacePath)
  const files = await listWorkspaceAssetFiles(workspacePath)
  const syncedAssets = syncAssetsWithFiles(marker.assets, files)
  const persistedIds = new Set(marker.assets.map((asset) => asset.id))
  const assets = await ensureAssetsMetadata(
    workspacePath,
    syncedAssets,
    new Set(marker.assetsMissingMetadata),
    persistedIds,
  )
  const extractedMetadata =
    marker.assetsMissingMetadata.length > 0 ||
    syncedAssets.some((asset) => !persistedIds.has(asset.id))

  if (haveAssetsChanged(marker.assets, assets) || extractedMetadata) {
    await persistWorkspaceAssets(workspacePath, assets)
  }

  return groupAssetsByKind(assets)
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

      const name = path.basename(destinationPath)
      const metadata = await getMediaMetadata(destinationPath, assetKind)

      imported.push(
        createAsset(
          {
            name,
            kind: assetKind,
            source: getAssetSource(assetKind, name),
          },
          new Date().toISOString(),
          metadata,
        ),
      )
    } catch {
      skipped.push(filename)
    }
  }

  if (imported.length > 0) {
    const marker = await getOrCreateWorkspaceMarker(workspacePath)

    await persistWorkspaceAssets(workspacePath, [...marker.assets, ...imported])
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
  assetId: string,
  nextName: string,
): Promise<WorkspaceAssets> {
  if (typeof workspacePath !== 'string' || typeof assetId !== 'string') {
    throw new Error('Invalid asset')
  }

  if (typeof nextName !== 'string') {
    throw new Error('Invalid asset name')
  }

  if (!(await pathExists(workspacePath))) {
    throw new Error('Workspace not found')
  }

  const assets = await listWorkspaceAssets(workspacePath)
  const asset = findAssetById(assets, assetId)

  if (!asset) {
    throw new Error('Asset not found')
  }

  const resolvedAssetPath = path.resolve(
    resolveAssetSource(workspacePath, asset.source),
  )

  if (!isWorkspaceAssetFile(workspacePath, resolvedAssetPath)) {
    throw new Error('Invalid asset source')
  }

  if (!(await pathExists(resolvedAssetPath))) {
    throw new Error('Asset not found')
  }

  const fileStat = await stat(resolvedAssetPath)

  if (!fileStat.isFile()) {
    throw new Error('Asset not found')
  }

  const nextFilename = buildRenamedFilename(asset.name, nextName)
  const directoryPath = path.dirname(resolvedAssetPath)
  const nextPath = path.resolve(directoryPath, nextFilename)

  if (path.dirname(nextPath) !== directoryPath) {
    throw new Error('Invalid asset name')
  }

  await renameAssetFile(resolvedAssetPath, nextPath)

  const marker = await getOrCreateWorkspaceMarker(workspacePath)
  const nextAssets = marker.assets.map((item) => {
    if (item.id !== assetId) {
      return item
    }

    return {
      ...item,
      name: nextFilename,
      source: getAssetSource(item.kind, nextFilename),
    }
  })

  await persistWorkspaceAssets(workspacePath, nextAssets)

  return listWorkspaceAssets(workspacePath)
}

export async function getAssetPreview(
  workspacePath: string,
  assetId: string,
): Promise<string | null> {
  if (typeof workspacePath !== 'string' || typeof assetId !== 'string') {
    throw new Error('Invalid asset')
  }

  const marker = await readWorkspaceMarker(workspacePath)
  const asset = marker?.assets.find((item) => item.id === assetId)

  if (!asset) {
    throw new Error('Asset not found')
  }

  if (asset.kind !== 'image' && asset.kind !== 'video') {
    return null
  }

  if (previewCache.has(assetId)) {
    return previewCache.get(assetId) ?? null
  }

  const resolvedAssetPath = path.resolve(
    resolveAssetSource(workspacePath, asset.source),
  )

  if (!isWorkspaceAssetFile(workspacePath, resolvedAssetPath)) {
    throw new Error('Invalid asset source')
  }

  if (!(await pathExists(resolvedAssetPath))) {
    previewCache.set(assetId, null)
    return null
  }

  const preview = await createAssetPreview(resolvedAssetPath, asset.kind)
  previewCache.set(assetId, preview)
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
