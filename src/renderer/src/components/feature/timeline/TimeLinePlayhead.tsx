import { usePlayback } from '@/components/feature/editor'
import { PointerEvent } from 'react'
import { TRACK_LABEL_WIDTH } from './timeline.constants'

interface TimeLinePlayheadProps {
  pixelsPerSecond: number
  onScrubStart: (event: PointerEvent<HTMLElement>) => void
  onScrubMove: (event: PointerEvent<HTMLElement>) => void
}

export function TimeLinePlayhead({
  pixelsPerSecond,
  onScrubStart,
  onScrubMove,
}: TimeLinePlayheadProps) {
  const { currentTime } = usePlayback()
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 z-30"
      style={{
        left: TRACK_LABEL_WIDTH + currentTime * pixelsPerSecond,
      }}
    >
      <button
        type="button"
        aria-label="Indicador de tempo"
        className="pointer-events-auto absolute top-0 left-1/2 z-30 h-3 w-3 -translate-x-1/2 cursor-ew-resize bg-primary"
        onPointerDown={onScrubStart}
        onPointerMove={onScrubMove}
      />
      <div className="h-full w-px bg-primary" aria-hidden />
    </div>
  )
}
