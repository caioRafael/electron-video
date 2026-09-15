import { Asset } from '../../shared/assets'
import { Project } from '../../shared/project'
import {
  Clip,
  getTimelineContentDuration,
  Timeline,
} from '../../shared/timeline'

export const BLACK_FRAME_ASSET_ID = '__patchwork_black_frame__'
export const DEFAULT_RENDER_WIDTH = 1920
export const DEFAULT_RENDER_HEIGHT = 1080
export const DEFAULT_RENDER_FPS = 30

const GAP_EPSILON = 1e-4

export interface MappedScene {
  type: 'image' | 'video'
  source: string
  duration: number
  mediaStart?: number
  shortMedia?: 'freeze'
  keepAudio?: boolean
}

export interface MappedAudioClip {
  source: string
  role: 'focus'
  start: number
  duration: number
}

export interface MappedComposition {
  output: string
  width: number
  height: number
  fps: number
  scenes: MappedScene[]
  audio?: MappedAudioClip[]
}

export interface MapTimelineToCompositionResult {
  composition: MappedComposition
  assetIds: string[]
}

interface ClipRange {
  start: number
  end: number
}

function getTrackClips(timeline: Timeline, kind: 'video' | 'audio'): Clip[] {
  const track = timeline.tracks.find((item) => item.kind === kind)

  if (!track) {
    return []
  }

  return [...track.clips].sort((left, right) => left.start - right.start)
}

function rangesOverlap(left: ClipRange, right: ClipRange): boolean {
  return left.start < right.end && right.start < left.end
}

function hasOverlap(range: ClipRange, ranges: ClipRange[]): boolean {
  return ranges.some((item) => rangesOverlap(range, item))
}

function requireAsset(assetsById: Map<string, Asset>, assetId: string): Asset {
  const asset = assetsById.get(assetId)

  if (!asset) {
    throw new Error('Asset not found')
  }

  return asset
}

function mapVisualScene(
  clip: Clip,
  asset: Asset,
  audioRanges: ClipRange[],
): MappedScene {
  const range: ClipRange = {
    start: clip.start,
    end: clip.start + clip.duration,
  }

  if (asset.kind === 'image') {
    return {
      type: 'image',
      source: clip.assetId,
      duration: clip.duration,
    }
  }

  if (asset.kind !== 'video') {
    throw new Error('Unsupported asset on video track')
  }

  return {
    type: 'video',
    source: clip.assetId,
    duration: clip.duration,
    mediaStart: clip.sourceStart,
    shortMedia: 'freeze',
    keepAudio: !hasOverlap(range, audioRanges),
  }
}

function createBlackScene(duration: number): MappedScene {
  return {
    type: 'image',
    source: BLACK_FRAME_ASSET_ID,
    duration,
  }
}

function appendUniqueAssetId(assetIds: string[], assetId: string): void {
  if (!assetIds.includes(assetId)) {
    assetIds.push(assetId)
  }
}

export function mapTimelineToComposition(
  project: Project,
  assets: Asset[],
): MapTimelineToCompositionResult {
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
  const visualClips = getTrackClips(project.timeline, 'video')
  const audioClips = getTrackClips(project.timeline, 'audio')

  if (visualClips.length === 0) {
    throw new Error('The timeline has no visual clips')
  }

  const audioRanges: ClipRange[] = audioClips.map((clip) => {
    return {
      start: clip.start,
      end: clip.start + clip.duration,
    }
  })
  const scenes: MappedScene[] = []
  const assetIds: string[] = []
  let cursor = 0

  for (const clip of visualClips) {
    const gap = clip.start - cursor

    if (gap > GAP_EPSILON) {
      scenes.push(createBlackScene(gap))
      appendUniqueAssetId(assetIds, BLACK_FRAME_ASSET_ID)
    }

    const asset = requireAsset(assetsById, clip.assetId)
    scenes.push(mapVisualScene(clip, asset, audioRanges))
    appendUniqueAssetId(assetIds, clip.assetId)
    cursor = Math.max(cursor, clip.start + clip.duration)
  }

  const timelineEnd = getTimelineContentDuration(project.timeline)
  const trailingGap = timelineEnd - cursor

  if (trailingGap > GAP_EPSILON) {
    scenes.push(createBlackScene(trailingGap))
    appendUniqueAssetId(assetIds, BLACK_FRAME_ASSET_ID)
  }

  const audio: MappedAudioClip[] = audioClips.map((clip) => {
    const asset = requireAsset(assetsById, clip.assetId)

    if (asset.kind !== 'audio') {
      throw new Error('Unsupported asset on audio track')
    }

    appendUniqueAssetId(assetIds, clip.assetId)

    return {
      source: clip.assetId,
      role: 'focus',
      start: clip.start,
      duration: clip.duration,
    }
  })

  return {
    composition: {
      output: 'output.mp4',
      width: DEFAULT_RENDER_WIDTH,
      height: DEFAULT_RENDER_HEIGHT,
      fps: DEFAULT_RENDER_FPS,
      scenes,
      ...(audio.length > 0 ? { audio } : {}),
    },
    assetIds,
  }
}
