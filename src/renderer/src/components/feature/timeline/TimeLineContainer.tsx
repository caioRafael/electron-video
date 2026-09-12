import { TimeLineContent } from './TimeLineContent'
import { TimeLineHeader } from './TimeLineHeader'
import { useTimelineHotkeys } from './useTimelineHotkeys'
import { useTimelineView } from './useTimelineView'

export function TimeLineContainer() {
  const {
    tracks,
    duration,
    pixelsPerSecond,
    currentTime,
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
        currentTime={currentTime}
        duration={duration}
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
        currentTime={currentTime}
      />
    </div>
  )
}
