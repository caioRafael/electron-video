import { CircleNotchIcon } from '@phosphor-icons/react'
import { useWorkspaceAssetDrop } from './useWorkspaceAssetDrop'

export function WorkspaceAssetDropOverlay() {
  const { isDraggingFiles, isImporting, error } = useWorkspaceAssetDrop()
  const shouldShowOverlay = isDraggingFiles || isImporting

  return (
    <>
      {shouldShowOverlay ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/10 supports-backdrop-filter:backdrop-blur-xs">
          <p className="flex items-center gap-1.5 border border-dashed bg-background px-2.5 py-2 font-medium">
            {isImporting ? <CircleNotchIcon className="animate-spin" /> : null}
            {isImporting
              ? 'Importando arquivos...'
              : 'Solte os arquivos para importar'}
          </p>
        </div>
      ) : null}
      {error ? (
        <p className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-2.5 text-center text-destructive">
          {error}
        </p>
      ) : null}
    </>
  )
}
