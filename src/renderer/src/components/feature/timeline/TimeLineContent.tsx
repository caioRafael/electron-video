import { useRef } from 'react'
import { TRACK_LABEL_WIDTH } from './timeline.constants'
import { TimeLinePlayhead } from './TimeLinePlayhead'
import { TimeLineRuler } from './TimeLineRuler'
import { TimeLineTrack } from './TimeLineTrack'
import { useTimelineScrub } from './useTimelineScrub'
import { TimelineTrackView } from './useTimelineView'

interface TimeLineContentProps {
  tracks: TimelineTrackView[]
  duration: number
  pixelsPerSecond: number
}

export function TimeLineContent({
  tracks,
  duration,
  pixelsPerSecond,
}: TimeLineContentProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const { startScrub, moveScrub } = useTimelineScrub(
    canvasRef,
    pixelsPerSecond,
    duration,
  )
  const canvasWidth = duration * pixelsPerSecond

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div
        ref={canvasRef}
        className="relative"
        style={{ width: TRACK_LABEL_WIDTH + canvasWidth }}
      >
        <TimeLineRuler
          duration={duration}
          pixelsPerSecond={pixelsPerSecond}
          onScrubStart={startScrub}
          onScrubMove={moveScrub}
        />
        {tracks.map((track) => (
          <TimeLineTrack
            key={track.id}
            track={track}
            duration={duration}
            pixelsPerSecond={pixelsPerSecond}
          />
        ))}
        <TimeLinePlayhead
          pixelsPerSecond={pixelsPerSecond}
          onScrubStart={startScrub}
          onScrubMove={moveScrub}
        />
      </div>
    </div>
  )
}
