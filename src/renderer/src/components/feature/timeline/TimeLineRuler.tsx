import { RULER_HEIGHT } from './timeline.constants'
import { MOCK_DURATION, MOCK_PIXELS_PER_SECOND } from './timeline.mock'
import { formatRulerTime, getRulerTicks } from './timeline.utils'

export function TimeLineRuler() {
  const ticks = getRulerTicks(MOCK_DURATION, MOCK_PIXELS_PER_SECOND)

  return (
    <div
      className="sticky top-0 z-20 select-none border-b bg-background"
      style={{ height: RULER_HEIGHT }}
    >
      {ticks.map((tick) => (
        <div
          key={tick.time}
          className="absolute top-0 flex h-full flex-col items-start"
          style={{ left: tick.time * MOCK_PIXELS_PER_SECOND }}
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
  )
}
