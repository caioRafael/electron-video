import { Button } from '@/components/ui/button'
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PlayIcon,
  PlusIcon,
} from '@phosphor-icons/react'
import {
  MOCK_CURRENT_TIME,
  MOCK_DURATION,
  MOCK_ZOOM_PERCENT,
} from './timeline.mock'
import { formatTimecode } from './timeline.utils'

interface TimeLineHeaderProps {
  title: string
}

export function TimeLineHeader({ title }: TimeLineHeaderProps) {
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
          <span className="text-foreground">
            {formatTimecode(MOCK_CURRENT_TIME)}
          </span>
          {' / '}
          {formatTimecode(MOCK_DURATION)}
        </p>
      </div>
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Diminuir zoom"
        >
          <MagnifyingGlassMinusIcon />
        </Button>
        <span className="w-10 text-center tabular-nums text-muted-foreground">
          {MOCK_ZOOM_PERCENT}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Aumentar zoom"
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
