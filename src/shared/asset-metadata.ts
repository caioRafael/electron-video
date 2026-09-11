export interface ImageAssetMetadata {
  kind: 'image'
  fileSize: number
  format: string
  width: number
  height: number
}

export interface VideoAssetMetadata {
  kind: 'video'
  fileSize: number
  format: string
  width: number
  height: number
  duration: number
  fps: number
  codec: string
}

export interface AudioAssetMetadata {
  kind: 'audio'
  fileSize: number
  format: string
  duration: number
  sampleRate: number
  channels: number
  codec: string
}

export type AssetMetadata =
  ImageAssetMetadata | VideoAssetMetadata | AudioAssetMetadata

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0
}

function isPositiveInteger(value: unknown): value is number {
  return isPositiveNumber(value) && Number.isInteger(value)
}

export function isImageAssetMetadata(
  value: unknown,
): value is ImageAssetMetadata {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const metadata = value as Record<string, unknown>

  return (
    metadata.kind === 'image' &&
    isNonNegativeNumber(metadata.fileSize) &&
    isNonEmptyString(metadata.format) &&
    isPositiveInteger(metadata.width) &&
    isPositiveInteger(metadata.height)
  )
}

export function isVideoAssetMetadata(
  value: unknown,
): value is VideoAssetMetadata {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const metadata = value as Record<string, unknown>

  return (
    metadata.kind === 'video' &&
    isNonNegativeNumber(metadata.fileSize) &&
    isNonEmptyString(metadata.format) &&
    isPositiveInteger(metadata.width) &&
    isPositiveInteger(metadata.height) &&
    isPositiveNumber(metadata.duration) &&
    isPositiveNumber(metadata.fps) &&
    isNonEmptyString(metadata.codec)
  )
}

export function isAudioAssetMetadata(
  value: unknown,
): value is AudioAssetMetadata {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const metadata = value as Record<string, unknown>

  return (
    metadata.kind === 'audio' &&
    isNonNegativeNumber(metadata.fileSize) &&
    isNonEmptyString(metadata.format) &&
    isPositiveNumber(metadata.duration) &&
    isPositiveInteger(metadata.sampleRate) &&
    isPositiveInteger(metadata.channels) &&
    isNonEmptyString(metadata.codec)
  )
}

export function isAssetMetadata(value: unknown): value is AssetMetadata {
  return (
    isImageAssetMetadata(value) ||
    isVideoAssetMetadata(value) ||
    isAudioAssetMetadata(value)
  )
}

export function isAssetMetadataForKind(
  value: unknown,
  kind: AssetMetadata['kind'],
): value is AssetMetadata {
  if (!isAssetMetadata(value)) {
    return false
  }

  return value.kind === kind
}
