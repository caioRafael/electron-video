import { z } from 'zod'

export type TrackKind = 'video' | 'audio'

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
