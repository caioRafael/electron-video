import { AUDIO_TRACK_HEIGHT, VIDEO_TRACK_HEIGHT } from './timeline.constants'
import { TimeLineClip } from './TimeLineClip'
import { MOCK_PIXELS_PER_SECOND, TimeLineTrackMock } from './timeline.mock'
import { TimeLineTrackLabel } from './TimeLineTrackLabel'

interface TimeLineTrackProps {
  track: TimeLineTrackMock
}

export function TimeLineTrack({ track }: TimeLineTrackProps) {
  const height =
    track.kind === 'video' ? VIDEO_TRACK_HEIGHT : AUDIO_TRACK_HEIGHT

  return (
    <div className="contents">
      <TimeLineTrackLabel
        kind={track.kind}
        label={track.label}
        height={height}
      />
      <div
        className="relative border-b bg-muted/30"
        style={{
          height,
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px)',
          backgroundSize: `${MOCK_PIXELS_PER_SECOND}px 100%`,
        }}
      >
        {track.clips.map((clip) => (
          <TimeLineClip
            key={clip.id}
            label={clip.label}
            kind={track.kind}
            start={clip.start}
            duration={clip.duration}
          />
        ))}
      </div>
    </div>
  )
}
