import { reorderClipInCurrentTimeline } from '@/services/workspace/session'
import { PointerEvent, useRef, useState } from 'react'
import { TimelineClipView } from './useTimelineView'

const MOVE_THRESHOLD_PX = 4

interface MoveDrag {
  originX: number
  start: number
}

export function useMoveTimelineClip(
  clip: TimelineClipView,
  pixelsPerSecond: number,
  onSelect: () => void,
) {
  const [offsetSeconds, setOffsetSeconds] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<MoveDrag | null>(null)

  function startMove(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)

    dragRef.current = {
      originX: event.clientX,
      start: clip.start,
    }
  }

  function moveClip(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current

    if (!drag) {
      return
    }

    const deltaPixels = event.clientX - drag.originX

    if (Math.abs(deltaPixels) < MOVE_THRESHOLD_PX && !isDragging) {
      return
    }

    setIsDragging(true)
    setOffsetSeconds(
      Math.max(0, drag.start + deltaPixels / pixelsPerSecond) - drag.start,
    )
  }

  async function endMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current

    if (!drag) {
      return
    }

    const deltaPixels = event.clientX - drag.originX
    const desiredStart = Math.max(0, drag.start + deltaPixels / pixelsPerSecond)
    const didDrag = Math.abs(deltaPixels) >= MOVE_THRESHOLD_PX

    dragRef.current = null
    setIsDragging(false)
    setOffsetSeconds(0)

    if (!didDrag) {
      onSelect()
      return
    }

    await reorderClipInCurrentTimeline(clip.id, desiredStart)
  }

  return {
    offsetSeconds,
    isDragging,
    startMove,
    moveClip,
    endMove,
  }
}
