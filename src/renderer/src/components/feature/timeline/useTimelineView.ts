import { findAssetById, WorkspaceAssets } from '@shared/assets'
import {
  createEmptyTimeline,
  getAssetSourceDuration,
  getTimelineDuration,
  getTrackLabel,
  Timeline,
  TrackKind,
} from '@shared/timeline'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useState } from 'react'
import {
  clampZoomPercent,
  DEFAULT_ZOOM_PERCENT,
  getPixelsPerSecond,
  MAX_ZOOM_PERCENT,
  MIN_ZOOM_PERCENT,
  ZOOM_PERCENT_STEP,
} from './timeline.constants'

export interface TimelineClipView {
  id: string
  assetId: string
  label: string
  start: number
  duration: number
  sourceStart: number
  sourceDuration: number | null
  minStart: number
  maxEnd: number
}

export interface TimelineTrackView {
  id: string
  kind: TrackKind
  label: string
  clips: TimelineClipView[]
}

interface TimelineView {
  tracks: TimelineTrackView[]
  duration: number
  pixelsPerSecond: number
  zoomPercent: number
  canZoomIn: boolean
  canZoomOut: boolean
  zoomIn: () => void
  zoomOut: () => void
}

const PLACEHOLDER_TRACKS: TimelineTrackView[] = [
  {
    id: 'placeholder-video',
    kind: 'video',
    label: 'V1',
    clips: [],
  },
  {
    id: 'placeholder-audio',
    kind: 'audio',
    label: 'A1',
    clips: [],
  },
]

function getTrackView(
  timeline: Timeline,
  assets: WorkspaceAssets,
): TimelineTrackView[] {
  const kindCount: Record<TrackKind, number> = {
    video: 0,
    audio: 0,
  }

  const tracks = timeline.tracks.map((track) => {
    const index = kindCount[track.kind]
    kindCount[track.kind] += 1

    return {
      id: track.id,
      kind: track.kind,
      label: getTrackLabel(track.kind, index),
      clips: track.clips.map((clip, clipIndex) => {
        const asset = findAssetById(assets, clip.assetId)
        const previousClip = track.clips[clipIndex - 1]
        const nextClip = track.clips[clipIndex + 1]

        return {
          id: clip.id,
          assetId: clip.assetId,
          label: asset?.name ?? clip.assetId,
          start: clip.start,
          duration: clip.duration,
          sourceStart: clip.sourceStart,
          sourceDuration: asset ? getAssetSourceDuration(asset) : null,
          minStart: previousClip
            ? previousClip.start + previousClip.duration
            : 0,
          maxEnd: nextClip ? nextClip.start : Number.POSITIVE_INFINITY,
        }
      }),
    }
  })

  if (kindCount.video === 0) {
    tracks.unshift({ ...PLACEHOLDER_TRACKS[0] })
  }

  if (kindCount.audio === 0) {
    tracks.push({ ...PLACEHOLDER_TRACKS[1] })
  }

  return tracks
}

export function useTimelineView(): TimelineView {
  const timeline = useWorkspaceStore((state) => state.currentProject?.timeline)
  const assets = useWorkspaceStore((state) => state.assets)
  const [zoomPercent, setZoomPercent] = useState(DEFAULT_ZOOM_PERCENT)
  const resolvedTimeline = timeline ?? createEmptyTimeline()

  function zoomIn() {
    setZoomPercent((current) => clampZoomPercent(current + ZOOM_PERCENT_STEP))
  }

  function zoomOut() {
    setZoomPercent((current) => clampZoomPercent(current - ZOOM_PERCENT_STEP))
  }

  return {
    tracks: getTrackView(resolvedTimeline, assets),
    duration: getTimelineDuration(resolvedTimeline),
    pixelsPerSecond: getPixelsPerSecond(zoomPercent),
    zoomPercent,
    canZoomIn: zoomPercent < MAX_ZOOM_PERCENT,
    canZoomOut: zoomPercent > MIN_ZOOM_PERCENT,
    zoomIn,
    zoomOut,
  }
}
