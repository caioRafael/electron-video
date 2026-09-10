export type AssetKind = 'audio' | 'video' | 'image'

export type AssetViewMode = 'list' | 'grid'

export interface Asset {
  name: string
  path: string
  kind: AssetKind
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
