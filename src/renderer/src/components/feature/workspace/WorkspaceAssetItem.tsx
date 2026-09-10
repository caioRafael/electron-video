import { Asset, AssetViewMode, getAssetExtension } from '@shared/assets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PencilSimpleIcon } from '@phosphor-icons/react'
import { FormEvent, KeyboardEvent, useId } from 'react'
import { useAssetRename } from './useAssetRename'
import { WorkspaceAssetPreview } from './WorkspaceAssetPreview'

interface WorkspaceAssetItemProps {
  asset: Asset
  disabled: boolean
  viewMode: AssetViewMode
}

export function WorkspaceAssetItem({
  asset,
  disabled,
  viewMode,
}: WorkspaceAssetItemProps) {
  const {
    isRenaming,
    draftName,
    error,
    setDraftName,
    startRename,
    cancelRename,
    commitRename,
  } = useAssetRename(asset)
  const errorId = useId()
  const isGrid = viewMode === 'grid'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    commitRename()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelRename()
    }
  }

  return (
    <li
      className={
        isGrid
          ? 'group flex flex-col gap-1'
          : 'group flex items-start gap-1.5 px-2.5 py-1'
      }
    >
      <div
        className={
          isGrid
            ? 'relative aspect-video w-full'
            : 'size-10 shrink-0 self-center'
        }
      >
        <WorkspaceAssetPreview asset={asset} />
        {isGrid && !isRenaming ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute top-1 right-1 bg-background/80 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
            disabled={disabled}
            onClick={startRename}
            aria-label={`Renomear ${asset.name}`}
          >
            <PencilSimpleIcon />
          </Button>
        ) : null}
      </div>
      {isRenaming ? (
        <form
          className="flex min-w-0 flex-1 flex-col gap-1"
          onSubmit={handleSubmit}
        >
          <div className="flex min-w-0 items-center gap-1">
            <Input
              value={draftName}
              disabled={disabled}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              aria-label="Novo nome do arquivo"
              autoFocus
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={() => {
                commitRename()
              }}
              onKeyDown={handleKeyDown}
            />
            <span className="shrink-0 text-muted-foreground">
              {getAssetExtension(asset.name)}
            </span>
          </div>
          {error ? (
            <p id={errorId} className="text-destructive">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
            title={asset.name}
            disabled={disabled}
            onDoubleClick={startRename}
          >
            {asset.name}
          </button>
          {isGrid ? null : (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
              disabled={disabled}
              onClick={startRename}
              aria-label={`Renomear ${asset.name}`}
            >
              <PencilSimpleIcon />
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
