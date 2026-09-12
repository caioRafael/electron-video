export const TRACK_LABEL_WIDTH = 112
export const VIDEO_TRACK_HEIGHT = 40
export const AUDIO_TRACK_HEIGHT = 32
export const RULER_HEIGHT = 28
export const PIXELS_PER_SECOND = 48
export const DEFAULT_ZOOM_PERCENT = 100
export const MIN_ZOOM_PERCENT = 25
export const MAX_ZOOM_PERCENT = 400
export const ZOOM_PERCENT_STEP = 25

export function clampZoomPercent(zoomPercent: number): number {
  return Math.min(MAX_ZOOM_PERCENT, Math.max(MIN_ZOOM_PERCENT, zoomPercent))
}

export function getPixelsPerSecond(zoomPercent: number): number {
  return PIXELS_PER_SECOND * (clampZoomPercent(zoomPercent) / 100)
}
