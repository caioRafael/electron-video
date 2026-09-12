import { Clip, getTrimmedClip, TrimEdge } from '@shared/timeline'
import { replaceClipInCurrentTimeline } from '@/services/workspace/session'
import { PointerEvent, useRef, useState } from 'react'
import { TimelineClipView } from './useTimelineView'

interface TrimDraft {
  start: number
  duration: number
  sourceStart: number
}

interface TrimDrag {
  edge: TrimEdge
  originX: number
  clip: Clip
  minStart: number
  maxEnd: number
  sourceDuration: number | null
}

export function useTrimTimelineClip(
  clip: TimelineClipView,
  pixelsPerSecond: number,
) {
  const [draft, setDraft] = useState<TrimDraft | null>(null)
  const dragRef = useRef<TrimDrag | null>(null)

  function getNextClip(clientX: number, drag: TrimDrag): Clip {
    return getTrimmedClip({
      clip: drag.clip,
      edge: drag.edge,
      deltaSeconds: (clientX - drag.originX) / pixelsPerSecond,
      minStart: drag.minStart,
      maxEnd: drag.maxEnd,
      sourceDuration: drag.sourceDuration,
    })
  }

  function startTrim(edge: TrimEdge, event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)

    dragRef.current = {
      edge,
      originX: event.clientX,
      clip: {
        id: clip.id,
        assetId: clip.assetId,
        start: clip.start,
        duration: clip.duration,
        sourceStart: clip.sourceStart,
      },
      minStart: clip.minStart,
      maxEnd: clip.maxEnd,
      sourceDuration: clip.sourceDuration,
    }
  }

  function moveTrim(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current

    if (!drag) {
      return
    }

    const nextClip = getNextClip(event.clientX, drag)

    setDraft({
      start: nextClip.start,
      duration: nextClip.duration,
      sourceStart: nextClip.sourceStart,
    })
  }

  async function endTrim(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current

    if (!drag) {
      return
    }

    const nextClip = getNextClip(event.clientX, drag)

    dragRef.current = null
    setDraft(null)

    if (
      nextClip.start === drag.clip.start &&
      nextClip.duration === drag.clip.duration &&
      nextClip.sourceStart === drag.clip.sourceStart
    ) {
      return
    }

    await replaceClipInCurrentTimeline(nextClip)
  }

  return {
    draft,
    startTrim,
    moveTrim,
    endTrim,
  }
}
