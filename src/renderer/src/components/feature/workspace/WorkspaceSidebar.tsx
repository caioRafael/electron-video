import { Button } from '@/components/ui/button'
import { closeWorkspace } from '@/services/workspace/session'
import { useWorkspaceStore } from '@/stores/workspace.store'
import {
  ArrowsLeftRightIcon,
  CircleNotchIcon,
  ListIcon,
  PlusIcon,
  SquaresFourIcon,
} from '@phosphor-icons/react'
import { useImportWorkspaceAssets } from './useImportWorkspaceAssets'
import { WorkspaceAssetList } from './WorkspaceAssetList'

export function WorkspaceSidebar() {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)
  const assets = useWorkspaceStore((state) => state.assets)
  const assetViewMode = useWorkspaceStore((state) => state.assetViewMode)
  const setAssetViewMode = useWorkspaceStore((state) => state.setAssetViewMode)
  const { importAssets, isImporting, error } = useImportWorkspaceAssets()

  if (!currentWorkspace) {
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-2 border-b px-2.5 py-2">
        <p className="min-w-0 truncate font-medium">{currentWorkspace.name}</p>
        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={assetViewMode === 'list' ? 'bg-muted' : undefined}
            aria-pressed={assetViewMode === 'list'}
            onClick={() => setAssetViewMode('list')}
            aria-label="Visualização em lista"
          >
            <ListIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={assetViewMode === 'grid' ? 'bg-muted' : undefined}
            aria-pressed={assetViewMode === 'grid'}
            onClick={() => setAssetViewMode('grid')}
            aria-label="Visualização em grade"
          >
            <SquaresFourIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isImporting}
            onClick={() => importAssets()}
            aria-label="Adicionar arquivos"
          >
            {isImporting ? (
              <CircleNotchIcon className="animate-spin" />
            ) : (
              <PlusIcon />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isImporting}
            onClick={closeWorkspace}
            aria-label="Trocar workspace"
          >
            <ArrowsLeftRightIcon />
          </Button>
        </div>
      </header>
      {error ? <p className="px-2.5 py-2 text-destructive">{error}</p> : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkspaceAssetList
          assets={assets}
          isImporting={isImporting}
          viewMode={assetViewMode}
          onImport={importAssets}
        />
      </div>
    </div>
  )
}
