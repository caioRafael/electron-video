import { useEditorStore } from '@/stores/editor.store'
import { AUDIO_TRACK_HEIGHT, VIDEO_TRACK_HEIGHT } from './timeline.constants'
import { TimeLineClip } from './TimeLineClip'
import { TimeLineTrackLabel } from './TimeLineTrackLabel'
import { TimelineTrackView } from './useTimelineView'

interface TimeLineTrackProps {
  track: TimelineTrackView
  duration: number
  pixelsPerSecond: number
}

export function TimeLineTrack({
  track,
  duration,
  pixelsPerSecond,
}: TimeLineTrackProps) {
  const setSelectedClipId = useEditorStore((state) => state.setSelectedClipId)
  const height =
    track.kind === 'video' ? VIDEO_TRACK_HEIGHT : AUDIO_TRACK_HEIGHT
  const canvasWidth = duration * pixelsPerSecond

  return (
    <div className="flex">
      <TimeLineTrackLabel
        kind={track.kind}
        label={track.label}
        height={height}
      />
      <div
        className="relative shrink-0 border-b bg-muted/30"
        style={{
          width: canvasWidth,
          height,
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px)',
          backgroundSize: `${pixelsPerSecond}px 100%`,
        }}
        onPointerDown={() => setSelectedClipId(null)}
      >
        {track.clips.map((clip) => (
          <TimeLineClip
            key={clip.id}
            clip={clip}
            kind={track.kind}
            pixelsPerSecond={pixelsPerSecond}
          />
        ))}
      </div>
    </div>
  )
}
