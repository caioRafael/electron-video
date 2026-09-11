import { Workspace } from '@shared/workspace'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getProjectError, selectWorkspace } from '@/services/workspace/session'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { CircleNotchIcon, PlusIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { CreateWorkspaceForm } from './CreateWorkspaceForm'

interface WorkspaceModalProps {
  open: boolean
}

export function WorkspaceModal({ open }: WorkspaceModalProps) {
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const [isCreating, setIsCreating] = useState(false)
  const [openingWorkspaceId, setOpeningWorkspaceId] = useState<string | null>(
    null,
  )
  const [error, setError] = useState('')

  async function handleSelectWorkspace(workspace: Workspace) {
    setOpeningWorkspaceId(workspace.id)
    setError('')

    try {
      await selectWorkspace(workspace)
    } catch (selectError) {
      setError(getProjectError(selectError))
    } finally {
      setOpeningWorkspaceId(null)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onFocusOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Novo Workspace' : 'Workspace'}
          </DialogTitle>
        </DialogHeader>
        {isCreating ? (
          <CreateWorkspaceForm onCancel={() => setIsCreating(false)} />
        ) : (
          <>
            <div>
              <Button
                variant="outline"
                disabled={Boolean(openingWorkspaceId)}
                onClick={() => setIsCreating(true)}
              >
                <PlusIcon /> Novo Workspace
              </Button>
            </div>
            {error ? <p className="text-destructive">{error}</p> : null}
            {workspaces.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum workspace criado ainda
              </p>
            ) : (
              <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                {workspaces.map((workspace) => {
                  const isOpening = openingWorkspaceId === workspace.id

                  return (
                    <li key={workspace.id}>
                      <button
                        type="button"
                        disabled={Boolean(openingWorkspaceId)}
                        className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => handleSelectWorkspace(workspace)}
                      >
                        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                          <span className="font-medium">{workspace.name}</span>
                          <span className="w-full truncate text-muted-foreground">
                            {workspace.path}
                          </span>
                        </span>
                        {isOpening ? (
                          <CircleNotchIcon className="size-4 shrink-0 animate-spin" />
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
