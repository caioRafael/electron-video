import { z } from 'zod'
import { AssetKind, Asset } from './assets'

export type TrackKind = 'video' | 'audio'

export type TrimEdge = 'start' | 'end'

export const DEFAULT_CLIP_DURATION = 5
export const MIN_CLIP_DURATION = 0.1
export const MIN_TIMELINE_DURATION = 30

export interface Clip {
  id: string
  assetId: string
  start: number
  duration: number
  sourceStart: number
}

export interface Track {
  id: string
  kind: TrackKind
  clips: Clip[]
}

export interface Timeline {
  tracks: Track[]
}

export function createEmptyTimeline(): Timeline {
  return {
    tracks: [],
  }
}

export function isTrackKind(value: unknown): value is TrackKind {
  return value === 'video' || value === 'audio'
}

export const clipSchema = z.object({
  id: z.string().min(1),
  assetId: z.string().min(1),
  start: z.number().finite().nonnegative(),
  duration: z.number().finite().positive(),
  sourceStart: z.number().finite().nonnegative(),
})

export const trackSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['video', 'audio']),
  clips: z.array(clipSchema),
})

export const timelineSchema = z.object({
  tracks: z.array(trackSchema),
})

export function getTrackKindForAsset(kind: AssetKind): TrackKind {
  return kind === 'audio' ? 'audio' : 'video'
}

export function getAssetClipDuration(asset: Asset): number {
  return getAssetSourceDuration(asset) ?? DEFAULT_CLIP_DURATION
}

export function getAssetSourceDuration(asset: Asset): number | null {
  if (
    asset.metadata &&
    (asset.metadata.kind === 'video' || asset.metadata.kind === 'audio')
  ) {
    return asset.metadata.duration
  }

  return null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function getTrackEnd(track: Track): number {
  return track.clips.reduce((end, clip) => {
    return Math.max(end, clip.start + clip.duration)
  }, 0)
}

export function getTimelineDuration(timeline: Timeline): number {
  const contentEnd = timeline.tracks.reduce((end, track) => {
    return Math.max(end, getTrackEnd(track))
  }, 0)

  return Math.max(contentEnd, MIN_TIMELINE_DURATION)
}

export function getTrackLabel(kind: TrackKind, index: number): string {
  const prefix = kind === 'video' ? 'V' : 'A'
  return `${prefix}${index + 1}`
}

export function appendAssetToTimeline(
  timeline: Timeline,
  asset: Asset,
): Timeline {
  const kind = getTrackKindForAsset(asset.kind)
  const duration = getAssetClipDuration(asset)
  const existingTrack = timeline.tracks.find((track) => track.kind === kind)

  const clip: Clip = {
    id: `clip_${crypto.randomUUID()}`,
    assetId: asset.id,
    start: existingTrack ? getTrackEnd(existingTrack) : 0,
    duration,
    sourceStart: 0,
  }

  if (!existingTrack) {
    const track: Track = {
      id: `track_${crypto.randomUUID()}`,
      kind,
      clips: [clip],
    }

    return {
      tracks: [...timeline.tracks, track],
    }
  }

  return {
    tracks: timeline.tracks.map((track) => {
      if (track.id !== existingTrack.id) {
        return track
      }

      return {
        ...track,
        clips: [...track.clips, clip],
      }
    }),
  }
}

export interface TrimClipInput {
  clip: Clip
  edge: TrimEdge
  deltaSeconds: number
  minStart: number
  maxEnd: number
  sourceDuration: number | null
}

export function getTrimmedClip(input: TrimClipInput): Clip {
  const { clip, edge, deltaSeconds, minStart, maxEnd, sourceDuration } = input

  if (edge === 'end') {
    const sourceMaxEnd =
      sourceDuration === null
        ? maxEnd
        : clip.start + (sourceDuration - clip.sourceStart)
    const nextEnd = clamp(
      clip.start + clip.duration + deltaSeconds,
      clip.start + MIN_CLIP_DURATION,
      Math.min(maxEnd, sourceMaxEnd),
    )

    return {
      ...clip,
      duration: nextEnd - clip.start,
    }
  }

  const minStartFromSource =
    sourceDuration === null ? minStart : clip.start - clip.sourceStart
  const nextStart = clamp(
    clip.start + deltaSeconds,
    Math.max(0, minStart, minStartFromSource),
    clip.start + clip.duration - MIN_CLIP_DURATION,
  )
  const appliedDelta = nextStart - clip.start

  return {
    ...clip,
    start: nextStart,
    duration: clip.duration - appliedDelta,
    sourceStart:
      sourceDuration === null
        ? clip.sourceStart
        : clip.sourceStart + appliedDelta,
  }
}

export function replaceClipInTimeline(
  timeline: Timeline,
  nextClip: Clip,
): Timeline {
  return {
    tracks: timeline.tracks.map((track) => {
      return {
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== nextClip.id) {
            return clip
          }

          return nextClip
        }),
      }
    }),
  }
}

export function getReorderedClips(
  clips: Clip[],
  clipId: string,
  desiredStart: number,
): Clip[] {
  const clip = clips.find((item) => item.id === clipId)

  if (!clip) {
    return clips
  }

  const others = clips.filter((item) => item.id !== clipId)
  const insertIndex = others.findIndex((item) => {
    return desiredStart < item.start + item.duration / 2
  })
  const nextIndex = insertIndex === -1 ? others.length : insertIndex
  const ordered = [
    ...others.slice(0, nextIndex),
    clip,
    ...others.slice(nextIndex),
  ]

  let start = 0

  return ordered.map((item) => {
    const nextClip = {
      ...item,
      start,
    }

    start += item.duration

    return nextClip
  })
}

export function reorderClipInTimeline(
  timeline: Timeline,
  clipId: string,
  desiredStart: number,
): Timeline {
  return {
    tracks: timeline.tracks.map((track) => {
      if (!track.clips.some((clip) => clip.id === clipId)) {
        return track
      }

      const clips = getReorderedClips(track.clips, clipId, desiredStart)
      const orderUnchanged = clips.every((clip, index) => {
        return clip.id === track.clips[index]?.id
      })

      if (orderUnchanged) {
        return track
      }

      return {
        ...track,
        clips,
      }
    }),
  }
}

export function removeClipFromTimeline(
  timeline: Timeline,
  clipId: string,
): Timeline {
  return {
    tracks: timeline.tracks
      .map((track) => {
        return {
          ...track,
          clips: track.clips.filter((clip) => clip.id !== clipId),
        }
      })
      .filter((track) => track.clips.length > 0),
  }
}
