import { TrackKind } from '@shared/timeline'

export interface TimeLineClipMock {
  id: string
  label: string
  start: number
  duration: number
}

export interface TimeLineTrackMock {
  id: string
  kind: TrackKind
  label: string
  clips: TimeLineClipMock[]
}

export const MOCK_CURRENT_TIME = 6.5
export const MOCK_DURATION = 30
export const MOCK_PIXELS_PER_SECOND = 48
export const MOCK_ZOOM_PERCENT = 100

export const MOCK_TRACKS: TimeLineTrackMock[] = [
  {
    id: 'video-1',
    kind: 'video',
    label: 'V1',
    clips: [
      { id: 'clip-1', label: 'Intro', start: 0.5, duration: 7 },
      { id: 'clip-2', label: 'Take 01', start: 8, duration: 9 },
    ],
  },
  {
    id: 'audio-1',
    kind: 'audio',
    label: 'A1',
    clips: [{ id: 'clip-3', label: 'Voice-over', start: 0.5, duration: 16.5 }],
  },
]
