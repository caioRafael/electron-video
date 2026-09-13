import { usePlaybackActions } from '@/components/feature/editor'
import { PointerEvent, RefObject } from 'react'
import { TRACK_LABEL_WIDTH } from './timeline.constants'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getTimeFromClientX(
  clientX: number,
  canvas: HTMLElement,
  pixelsPerSecond: number,
  duration: number,
): number {
  const rect = canvas.getBoundingClientRect()
  const time = (clientX - rect.left - TRACK_LABEL_WIDTH) / pixelsPerSecond

  return clamp(time, 0, duration)
}

export function useTimelineScrub(
  canvasRef: RefObject<HTMLElement | null>,
  pixelsPerSecond: number,
  duration: number,
) {
  const { setCurrentTime } = usePlaybackActions()

  function scrubFromEvent(event: PointerEvent<HTMLElement>) {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    setCurrentTime(
      getTimeFromClientX(event.clientX, canvas, pixelsPerSecond, duration),
    )
  }

  function startScrub(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    scrubFromEvent(event)
  }

  function moveScrub(event: PointerEvent<HTMLElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return
    }

    scrubFromEvent(event)
  }

  return {
    startScrub,
    moveScrub,
  }
}
