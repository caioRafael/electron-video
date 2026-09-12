import { TRACK_LABEL_WIDTH } from './timeline.constants'

interface TimeLinePlayheadProps {
  currentTime: number
  pixelsPerSecond: number
}

export function TimeLinePlayhead({
  currentTime,
  pixelsPerSecond,
}: TimeLinePlayheadProps) {
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 z-20"
      style={{
        left: TRACK_LABEL_WIDTH + currentTime * pixelsPerSecond,
      }}
      aria-hidden
    >
      <div className="absolute top-0 left-1/2 h-2 w-1.5 -translate-x-1/2 bg-primary" />
      <div className="h-full w-px bg-primary" />
    </div>
  )
}
