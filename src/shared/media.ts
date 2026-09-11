export const MEDIA_PROTOCOL = 'videolab'
export const MEDIA_ASSET_HOST = 'asset'

export interface MediaSource {
  url: string
}

export function createAssetMediaUrl(assetId: string): string {
  return `${MEDIA_PROTOCOL}://${MEDIA_ASSET_HOST}/${assetId}`
}

export function parseAssetMediaRequestUrl(requestUrl: string): string {
  if (requestUrl.includes('..')) {
    throw new Error('Invalid asset')
  }

  let url: URL

  try {
    url = new URL(requestUrl)
  } catch {
    throw new Error('Invalid asset')
  }

  if (url.protocol !== `${MEDIA_PROTOCOL}:`) {
    throw new Error('Invalid asset')
  }

  if (url.hostname !== MEDIA_ASSET_HOST) {
    throw new Error('Invalid asset')
  }

  const assetId = decodeURIComponent(url.pathname.replace(/^\/+/, ''))

  if (
    !assetId ||
    assetId.includes('/') ||
    assetId.includes('\\') ||
    assetId.includes('..')
  ) {
    throw new Error('Invalid asset')
  }

  return assetId
}

export type MediaPlatformKey =
  | 'darwin-arm64'
  | 'darwin-x64'
  | 'win32-x64'
  | 'win32-arm64'
  | 'linux-x64'
  | 'linux-arm64'

export interface MediaRuntimeInfo {
  ffmpegPath: string
  ffprobePath: string
  ffmpegVersion: string | null
  ffprobeVersion: string | null
  platform: MediaPlatformKey
  license: 'LGPLv2.1+' | 'LGPLv3'
}
