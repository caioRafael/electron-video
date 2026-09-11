import { stat } from 'node:fs/promises'
import {
  AssetMetadata,
  AudioAssetMetadata,
  ImageAssetMetadata,
  VideoAssetMetadata,
} from '../../shared/asset-metadata'
import { AssetKind } from '../../shared/assets'
import { FFprobeOutput, FFprobeStream, probeMediaFile } from './ffprobe'

function parsePositiveNumber(
  value: string | number | undefined,
): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null
  }

  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function parsePositiveInteger(
  value: string | number | undefined,
): number | null {
  const parsed = parsePositiveNumber(value)

  if (parsed === null || !Number.isInteger(parsed)) {
    return null
  }

  return parsed
}

function parseFrameRate(value: string | undefined): number | null {
  if (!value || value === '0/0' || value === '0') {
    return null
  }

  const [numerator, denominator] = value.split('/')
  const top = Number(numerator)
  const bottom = denominator === undefined ? 1 : Number(denominator)

  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom === 0) {
    return null
  }

  const fps = top / bottom

  if (!Number.isFinite(fps) || fps <= 0) {
    return null
  }

  return fps
}

function findStream(
  streams: FFprobeStream[] | undefined,
  codecType: 'audio' | 'video',
): FFprobeStream | undefined {
  return streams?.find((stream) => stream.codec_type === codecType)
}

function getFormatName(probe: FFprobeOutput): string | null {
  const formatName = probe.format?.format_name?.trim()

  if (!formatName) {
    return null
  }

  return formatName
}

function mapImageMetadata(
  probe: FFprobeOutput,
  fileSize: number,
): ImageAssetMetadata | null {
  const stream = findStream(probe.streams, 'video')
  const format = getFormatName(probe)
  const width = parsePositiveInteger(stream?.width)
  const height = parsePositiveInteger(stream?.height)

  if (!format || width === null || height === null) {
    return null
  }

  return {
    kind: 'image',
    fileSize,
    format,
    width,
    height,
  }
}

function mapVideoMetadata(
  probe: FFprobeOutput,
  fileSize: number,
): VideoAssetMetadata | null {
  const stream = findStream(probe.streams, 'video')
  const format = getFormatName(probe)
  const width = parsePositiveInteger(stream?.width)
  const height = parsePositiveInteger(stream?.height)
  const duration =
    parsePositiveNumber(stream?.duration) ??
    parsePositiveNumber(probe.format?.duration)
  const fps =
    parseFrameRate(stream?.avg_frame_rate) ??
    parseFrameRate(stream?.r_frame_rate)
  const codec = stream?.codec_name?.trim()

  if (
    !format ||
    !codec ||
    width === null ||
    height === null ||
    duration === null ||
    fps === null
  ) {
    return null
  }

  return {
    kind: 'video',
    fileSize,
    format,
    width,
    height,
    duration,
    fps,
    codec,
  }
}

function mapAudioMetadata(
  probe: FFprobeOutput,
  fileSize: number,
): AudioAssetMetadata | null {
  const stream = findStream(probe.streams, 'audio')
  const format = getFormatName(probe)
  const duration =
    parsePositiveNumber(stream?.duration) ??
    parsePositiveNumber(probe.format?.duration)
  const sampleRate = parsePositiveInteger(stream?.sample_rate)
  const channels = parsePositiveInteger(stream?.channels)
  const codec = stream?.codec_name?.trim()

  if (
    !format ||
    !codec ||
    duration === null ||
    sampleRate === null ||
    channels === null
  ) {
    return null
  }

  return {
    kind: 'audio',
    fileSize,
    format,
    duration,
    sampleRate,
    channels,
    codec,
  }
}

export async function getMediaMetadata(
  filePath: string,
  kind: AssetKind,
): Promise<AssetMetadata | null> {
  try {
    const [probe, fileStat] = await Promise.all([
      probeMediaFile(filePath),
      stat(filePath),
    ])

    if (!fileStat.isFile()) {
      return null
    }

    const fileSize = fileStat.size

    if (kind === 'image') {
      return mapImageMetadata(probe, fileSize)
    }

    if (kind === 'video') {
      return mapVideoMetadata(probe, fileSize)
    }

    return mapAudioMetadata(probe, fileSize)
  } catch (error) {
    console.error('[media] failed to extract metadata', error)
    return null
  }
}
