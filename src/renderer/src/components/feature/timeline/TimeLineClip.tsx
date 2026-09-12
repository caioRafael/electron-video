import { TrackKind } from '@shared/timeline'
import { MOCK_PIXELS_PER_SECOND } from './timeline.mock'
import { getWaveformBars } from './timeline.utils'

interface TimeLineClipProps {
  label: string
  kind: TrackKind
  start: number
  duration: number
}

export function TimeLineClip({
  label,
  kind,
  start,
  duration,
}: TimeLineClipProps) {
  const width = Math.max(duration * MOCK_PIXELS_PER_SECOND, 8)
  const showDetails = width >= 48

  if (kind === 'audio') {
    const bars = getWaveformBars(
      label,
      Math.min(40, Math.max(8, Math.floor(width / 4))),
    )

    return (
      <div
        className="absolute inset-y-1 overflow-hidden border bg-secondary"
        style={{ left: start * MOCK_PIXELS_PER_SECOND, width }}
      >
        <div className="flex h-full items-center gap-1 px-1.5">
          {showDetails ? (
            <span className="truncate text-[10px] font-medium">{label}</span>
          ) : null}
          <div className="flex h-4 min-w-0 flex-1 items-center gap-px">
            {bars.map((height, index) => (
              <span
                key={index}
                className="w-px bg-foreground/40"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="absolute inset-y-1 overflow-hidden border border-primary/40 bg-primary/15"
      style={{ left: start * MOCK_PIXELS_PER_SECOND, width }}
    >
      <div className="flex h-full">
        {showDetails ? (
          <div className="flex w-1.5 flex-col justify-between py-1">
            <span className="size-1 bg-background/70" />
            <span className="size-1 bg-background/70" />
            <span className="size-1 bg-background/70" />
          </div>
        ) : null}
        {showDetails ? (
          <p className="min-w-0 flex-1 truncate px-1.5 py-1 text-[10px] font-medium">
            {label}
          </p>
        ) : null}
        {showDetails ? (
          <div className="flex w-1.5 flex-col justify-between py-1">
            <span className="size-1 bg-background/70" />
            <span className="size-1 bg-background/70" />
            <span className="size-1 bg-background/70" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
