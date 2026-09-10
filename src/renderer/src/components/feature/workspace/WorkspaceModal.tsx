import { Workspace } from '@shared/workspace'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDirectoryPath } from '@/services/workspace/get-directory-path.service'
import {
  createAndSelectWorkspace,
  selectWorkspace,
} from '@/services/workspace/session'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { FolderOpenIcon, PlusIcon } from '@phosphor-icons/react'
import { useState } from 'react'

interface WorkspaceModalProps {
  open: boolean
}

export function WorkspaceModal({ open }: WorkspaceModalProps) {
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [directory, setDirectory] = useState('')

  async function handleSelectDirectory(): Promise<void> {
    const selectedDirectory = await getDirectoryPath()

    if (selectedDirectory) {
      setDirectory(selectedDirectory)
    }
  }

  async function handleCreate(): Promise<void> {
    await createAndSelectWorkspace(directory, name)
    setIsCreating(false)
    setName('')
    setDirectory('')
  }

  async function handleSelectWorkspace(workspace: Workspace): Promise<void> {
    await selectWorkspace(workspace)
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="workspace-name">Nome</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="workspace-directory">Diretório</Label>
              <div className="flex gap-2">
                <Input
                  id="workspace-directory"
                  className="min-w-0"
                  value={directory}
                  placeholder="Selecione um diretório"
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSelectDirectory}
                >
                  <FolderOpenIcon />
                  Escolher
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleCreate}>
                Criar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div>
              <Button variant="outline" onClick={() => setIsCreating(true)}>
                <PlusIcon /> Novo Workspace
              </Button>
            </div>
            {workspaces.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum workspace criado ainda
              </p>
            ) : (
              <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                {workspaces.map((workspace) => (
                  <li key={workspace.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-2.5 py-2 text-left hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                      onClick={() => handleSelectWorkspace(workspace)}
                    >
                      <span className="font-medium">{workspace.name}</span>
                      <span className="w-full truncate text-muted-foreground">
                        {workspace.path}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
