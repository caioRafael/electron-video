import { RULER_HEIGHT, TRACK_LABEL_WIDTH } from './timeline.constants'
import { formatRulerTime, getRulerTicks } from './timeline.utils'

interface TimeLineRulerProps {
  duration: number
  pixelsPerSecond: number
}

export function TimeLineRuler({
  duration,
  pixelsPerSecond,
}: TimeLineRulerProps) {
  const ticks = getRulerTicks(duration, pixelsPerSecond)
  const canvasWidth = duration * pixelsPerSecond

  return (
    <div className="sticky top-0 z-20 flex">
      <div
        className="sticky left-0 z-30 shrink-0 border-b border-r bg-background"
        style={{ width: TRACK_LABEL_WIDTH, height: RULER_HEIGHT }}
      />
      <div
        className="relative shrink-0 select-none border-b bg-background"
        style={{ width: canvasWidth, height: RULER_HEIGHT }}
      >
        {ticks.map((tick) => (
          <div
            key={tick.time}
            className="absolute top-0 flex h-full flex-col items-start"
            style={{ left: tick.time * pixelsPerSecond }}
          >
            <span
              className={
                tick.isMajor
                  ? 'h-2 w-px bg-foreground/40'
                  : 'h-1.5 w-px bg-border'
              }
            />
            {tick.isMajor ? (
              <span className="pl-1 text-[10px] leading-none text-muted-foreground">
                {formatRulerTime(tick.time)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
