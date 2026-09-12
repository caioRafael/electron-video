import { TrackKind } from '@shared/timeline'
import { FilmStripIcon, MusicNoteIcon } from '@phosphor-icons/react'
import { TRACK_LABEL_WIDTH } from './timeline.constants'

interface TimeLineTrackLabelProps {
  kind: TrackKind
  label: string
  height: number
}

export function TimeLineTrackLabel({
  kind,
  label,
  height,
}: TimeLineTrackLabelProps) {
  return (
    <div
      className="sticky left-0 z-30 flex shrink-0 items-center gap-2 border-b border-r bg-background px-2.5"
      style={{ width: TRACK_LABEL_WIDTH, height }}
    >
      {kind === 'video' ? (
        <FilmStripIcon className="size-4 text-muted-foreground" />
      ) : (
        <MusicNoteIcon className="size-4 text-muted-foreground" />
      )}
      <span className="font-medium">{label}</span>
    </div>
  )
}
