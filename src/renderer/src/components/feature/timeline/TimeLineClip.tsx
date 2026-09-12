import { TrackKind, TrimEdge } from '@shared/timeline'
import { Button } from '@/components/ui/button'
import { removeClipFromCurrentTimeline } from '@/services/workspace/session'
import { useEditorStore } from '@/stores/editor.store'
import { XIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { getWaveformBars } from './timeline.utils'
import { useMoveTimelineClip } from './useMoveTimelineClip'
import { TimelineClipView } from './useTimelineView'
import { useTrimTimelineClip } from './useTrimTimelineClip'

interface TimeLineClipProps {
  clip: TimelineClipView
  kind: TrackKind
  pixelsPerSecond: number
}

export function TimeLineClip({
  clip,
  kind,
  pixelsPerSecond,
}: TimeLineClipProps) {
  const selectedClipId = useEditorStore((state) => state.selectedClipId)
  const setSelectedClipId = useEditorStore((state) => state.setSelectedClipId)
  const isSelected = selectedClipId === clip.id
  const { draft, startTrim, moveTrim, endTrim } = useTrimTimelineClip(
    clip,
    pixelsPerSecond,
  )
  const { offsetSeconds, isDragging, startMove, moveClip, endMove } =
    useMoveTimelineClip(clip, pixelsPerSecond, () => {
      setSelectedClipId(clip.id)
    })
  const start = draft?.start ?? clip.start + offsetSeconds
  const duration = draft?.duration ?? clip.duration
  const width = Math.max(duration * pixelsPerSecond, 8)
  const showDetails = width >= 48
  const audioBars =
    kind === 'audio'
      ? getWaveformBars(
          clip.label,
          Math.min(40, Math.max(8, Math.floor(width / 4))),
        )
      : []

  async function handleDelete() {
    await removeClipFromCurrentTimeline(clip.id)

    if (isSelected) {
      setSelectedClipId(null)
    }
  }

  function renderHandle(edge: TrimEdge, label: string) {
    return (
      <button
        type="button"
        aria-label={label}
        className={
          edge === 'start'
            ? 'absolute inset-y-0 left-0 z-10 flex w-2 cursor-ew-resize touch-none flex-col items-center justify-between py-1'
            : 'absolute inset-y-0 right-0 z-10 flex w-2 cursor-ew-resize touch-none flex-col items-center justify-between py-1'
        }
        onPointerDown={(event) => startTrim(edge, event)}
        onPointerMove={moveTrim}
        onPointerUp={endTrim}
      >
        {showDetails ? (
          <>
            <span className="size-1 bg-background/70" />
            <span className="size-1 bg-background/70" />
            <span className="size-1 bg-background/70" />
          </>
        ) : null}
      </button>
    )
  }

  return (
    <div
      aria-grabbed={isDragging}
      className={cn(
        'absolute inset-y-0.5 overflow-hidden border',
        kind === 'audio' ? 'bg-secondary' : 'border-primary/40 bg-primary/15',
        isSelected && 'ring-1 ring-primary',
        isDragging ? 'z-20 cursor-grabbing' : 'z-10 cursor-grab',
      )}
      style={{ left: start * pixelsPerSecond, width }}
      onPointerDown={startMove}
      onPointerMove={moveClip}
      onPointerUp={endMove}
    >
      {renderHandle('start', `Ajustar início de ${clip.label}`)}
      {kind === 'audio' ? (
        <div className="flex h-full items-center gap-1 px-2">
          {showDetails ? (
            <span className="truncate text-[10px] font-medium">
              {clip.label}
            </span>
          ) : null}
          <div className="flex h-4 min-w-0 flex-1 items-center gap-px">
            {audioBars.map((height, index) => (
              <span
                key={index}
                className="w-px bg-foreground/40"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      ) : showDetails ? (
        <p className="min-w-0 truncate px-2.5 py-1 text-[10px] font-medium">
          {clip.label}
        </p>
      ) : null}
      {renderHandle('end', `Ajustar fim de ${clip.label}`)}
      {isSelected ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-0 right-2 z-20 bg-background/80"
          aria-label={`Remover ${clip.label} da timeline`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={handleDelete}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  )
}
