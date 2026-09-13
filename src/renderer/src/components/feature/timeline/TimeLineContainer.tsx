import { TimeLineContent } from './TimeLineContent'
import { TimeLineHeader } from './TimeLineHeader'
import { useTimelineHotkeys } from './useTimelineHotkeys'
import { useTimelineView } from './useTimelineView'

export function TimeLineContainer() {
  const {
    tracks,
    duration,
    pixelsPerSecond,
    zoomPercent,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
  } = useTimelineView()

  useTimelineHotkeys()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TimeLineHeader
        title="Timeline"
        zoomPercent={zoomPercent}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />
      <TimeLineContent
        tracks={tracks}
        duration={duration}
        pixelsPerSecond={pixelsPerSecond}
      />
    </div>
  )
}
