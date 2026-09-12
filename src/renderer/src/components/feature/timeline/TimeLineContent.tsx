import { RULER_HEIGHT, TRACK_LABEL_WIDTH } from './timeline.constants'
import {
  MOCK_DURATION,
  MOCK_PIXELS_PER_SECOND,
  MOCK_TRACKS,
} from './timeline.mock'
import { TimeLinePlayhead } from './TimeLinePlayhead'
import { TimeLineRuler } from './TimeLineRuler'
import { TimeLineTrack } from './TimeLineTrack'

export function TimeLineContent() {
  const canvasWidth = MOCK_DURATION * MOCK_PIXELS_PER_SECOND

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div
        className="relative min-h-full min-w-full"
        style={{ width: TRACK_LABEL_WIDTH + canvasWidth }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `${TRACK_LABEL_WIDTH}px minmax(${canvasWidth}px, 1fr)`,
          }}
        >
          <div
            className="sticky top-0 left-0 z-30 border-b border-r bg-background"
            style={{ height: RULER_HEIGHT }}
          />
          <TimeLineRuler />
          {MOCK_TRACKS.map((track) => (
            <TimeLineTrack key={track.id} track={track} />
          ))}
        </div>
        <TimeLinePlayhead currentTime={1.6} />
      </div>
    </div>
  )
}
