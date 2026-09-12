import { TRACK_LABEL_WIDTH } from './timeline.constants'
import { TimeLinePlayhead } from './TimeLinePlayhead'
import { TimeLineRuler } from './TimeLineRuler'
import { TimeLineTrack } from './TimeLineTrack'
import { TimelineTrackView } from './useTimelineView'

interface TimeLineContentProps {
  tracks: TimelineTrackView[]
  duration: number
  pixelsPerSecond: number
  currentTime: number
}

export function TimeLineContent({
  tracks,
  duration,
  pixelsPerSecond,
  currentTime,
}: TimeLineContentProps) {
  const canvasWidth = duration * pixelsPerSecond

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div
        className="relative"
        style={{ width: TRACK_LABEL_WIDTH + canvasWidth }}
      >
        <TimeLineRuler duration={duration} pixelsPerSecond={pixelsPerSecond} />
        {tracks.map((track) => (
          <TimeLineTrack
            key={track.id}
            track={track}
            duration={duration}
            pixelsPerSecond={pixelsPerSecond}
          />
        ))}
        <TimeLinePlayhead
          currentTime={currentTime}
          pixelsPerSecond={pixelsPerSecond}
        />
      </div>
    </div>
  )
}
