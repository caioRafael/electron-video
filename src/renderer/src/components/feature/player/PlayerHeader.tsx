import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores'
import { CircleNotchIcon, ExportIcon, XIcon } from '@phosphor-icons/react'
import { useRenderVideo } from './useRenderVideo'

export function PlayerHeader() {
  const currentProject = useWorkspaceStore((state) => state.currentProject)
  const { status, progress, error, start, cancel } = useRenderVideo()

  if (!currentProject) {
    return null
  }

  const isBusy = status === 'picking' || status === 'rendering'
  const percent =
    status === 'rendering' && progress
      ? Math.round(progress.progress * 100)
      : null

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {status === 'rendering' ? (
          <>
            <CircleNotchIcon
              className="size-4 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-xs text-muted-foreground">
              {percent === null ? 'Renderizando…' : `${percent}%`}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cancelar renderização"
              onClick={cancel}
            >
              <XIcon />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Renderizar vídeo final"
            disabled={isBusy}
            onClick={start}
          >
            <ExportIcon />
          </Button>
        )}
        {error ? (
          <p className="truncate text-xs text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  )
}
