import { AssetMetadata, isAssetMetadata } from './asset-metadata'

export type { AssetMetadata } from './asset-metadata'
export {
  isAssetMetadata,
  isAudioAssetMetadata,
  isImageAssetMetadata,
  isVideoAssetMetadata,
} from './asset-metadata'

export type AssetKind = 'audio' | 'video' | 'image'

export type AssetViewMode = 'list' | 'grid'

export interface Asset {
  id: string
  name: string
  kind: AssetKind
  source: string
  createdAt: string
  metadata: AssetMetadata | null
}

export interface WorkspaceAssets {
  audio: Asset[]
  videos: Asset[]
  images: Asset[]
}

export interface ImportAssetsResult {
  canceled: boolean
  imported: Asset[]
  skipped: string[]
  assets: WorkspaceAssets
}

export const EMPTY_WORKSPACE_ASSETS: WorkspaceAssets = {
  audio: [],
  videos: [],
  images: [],
}

export const ASSETS_DIRECTORY = 'assets'

export const ASSET_DIRECTORIES: Record<AssetKind, string> = {
  audio: 'audio',
  video: 'videos',
  image: 'images',
}

export function isAssetKind(value: unknown): value is AssetKind {
  return value === 'audio' || value === 'video' || value === 'image'
}

export function isAsset(value: unknown): value is Asset {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const asset = value as Record<string, unknown>

  if (
    typeof asset.id !== 'string' ||
    asset.id.length === 0 ||
    typeof asset.name !== 'string' ||
    asset.name.length === 0 ||
    !isAssetKind(asset.kind) ||
    typeof asset.source !== 'string' ||
    asset.source.length === 0 ||
    typeof asset.createdAt !== 'string' ||
    asset.createdAt.length === 0
  ) {
    return false
  }

  if (!Object.prototype.hasOwnProperty.call(asset, 'metadata')) {
    return true
  }

  return asset.metadata === null || isAssetMetadata(asset.metadata)
}

export function normalizeAsset(value: unknown): Asset | null {
  if (!isAsset(value)) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    kind: value.kind,
    source: value.source,
    createdAt: value.createdAt,
    metadata: isAssetMetadata(value.metadata) ? value.metadata : null,
  }
}

export function hasStoredAssetMetadata(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const asset = value as Record<string, unknown>

  if (!Object.prototype.hasOwnProperty.call(asset, 'metadata')) {
    return false
  }

  return asset.metadata === null || isAssetMetadata(asset.metadata)
}

export function getAssetSource(kind: AssetKind, filename: string): string {
  return `${ASSETS_DIRECTORY}/${ASSET_DIRECTORIES[kind]}/${filename}`
}

export function findAssetById(
  assets: WorkspaceAssets,
  assetId: string,
): Asset | undefined {
  return [...assets.audio, ...assets.videos, ...assets.images].find((asset) => {
    return asset.id === assetId
  })
}

export function getAssetBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.')

  if (lastDot <= 0) {
    return filename
  }

  return filename.slice(0, lastDot)
}

export function getAssetExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')

  if (lastDot <= 0) {
    return ''
  }

  return filename.slice(lastDot)
}
