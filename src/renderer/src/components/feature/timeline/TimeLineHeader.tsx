import { Button } from '@/components/ui/button'
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PlayIcon,
  PlusIcon,
} from '@phosphor-icons/react'
import { formatTimecode } from './timeline.utils'

interface TimeLineHeaderProps {
  title: string
  currentTime: number
  duration: number
  zoomPercent: number
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
}

export function TimeLineHeader({
  title,
  currentTime,
  duration,
  zoomPercent,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
}: TimeLineHeaderProps) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b px-2.5 py-2">
      <p className="min-w-0 truncate font-medium">{title}</p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Reproduzir"
        >
          <PlayIcon />
        </Button>
        <p className="tabular-nums text-muted-foreground">
          <span className="text-foreground">{formatTimecode(currentTime)}</span>
          {' / '}
          {formatTimecode(duration)}
        </p>
      </div>
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Diminuir zoom"
          disabled={!canZoomOut}
          onClick={onZoomOut}
        >
          <MagnifyingGlassMinusIcon />
        </Button>
        <span className="w-10 text-center tabular-nums text-muted-foreground">
          {zoomPercent}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Aumentar zoom"
          disabled={!canZoomIn}
          onClick={onZoomIn}
        >
          <MagnifyingGlassPlusIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Adicionar trilha"
        >
          <PlusIcon />
        </Button>
      </div>
    </header>
  )
}
