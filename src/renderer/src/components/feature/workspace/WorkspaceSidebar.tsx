import { Button } from '@/components/ui/button'
import { closeWorkspace } from '@/services/workspace/session'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { ArrowsLeftRightIcon } from '@phosphor-icons/react'
import { WorkspaceFileTree } from './WorkspaceFileTree'

export function WorkspaceSidebar() {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)
  const files = useWorkspaceStore((state) => state.files)

  if (!currentWorkspace) {
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-start justify-between gap-2 border-b px-2.5 py-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{currentWorkspace.name}</p>
          <p className="truncate text-muted-foreground">
            {currentWorkspace.path}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={closeWorkspace}
          aria-label="Trocar workspace"
        >
          <ArrowsLeftRightIcon />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        <WorkspaceFileTree entries={files} />
      </div>
    </div>
  )
}
