import { TRACK_LABEL_WIDTH } from './timeline.constants'
import { MOCK_PIXELS_PER_SECOND } from './timeline.mock'

interface TimeLinePlayheadProps {
  currentTime: number
}

export function TimeLinePlayhead({ currentTime }: TimeLinePlayheadProps) {
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 z-20"
      style={{
        left: TRACK_LABEL_WIDTH + currentTime * MOCK_PIXELS_PER_SECOND,
      }}
      aria-hidden
    >
      <div className="absolute top-0 left-1/2 h-2 w-1.5 -translate-x-1/2 bg-primary" />
      <div className="h-full w-px bg-primary" />
    </div>
  )
}
