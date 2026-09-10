import { Workspace } from '@shared/workspace'
import { createWorkspace } from '@/services/workspace/create.service'
import { listWorkspaceFiles } from '@/services/workspace/list-files.service'
import { listWorkspaces } from '@/services/workspace/list.service'
import { useWorkspaceStore } from '@/stores/workspace.store'

export async function refreshWorkspaces(): Promise<void> {
  const workspaces = await listWorkspaces()
  useWorkspaceStore.getState().setWorkspaces(workspaces)
}

export async function selectWorkspace(workspace: Workspace): Promise<void> {
  const files = await listWorkspaceFiles(workspace.path)

  useWorkspaceStore.getState().setCurrentWorkspace(workspace)
  useWorkspaceStore.getState().setFiles(files)
}

export async function createAndSelectWorkspace(
  parentDirectory: string,
  name: string,
): Promise<void> {
  const workspace = await createWorkspace(parentDirectory, name)

  await refreshWorkspaces()
  await selectWorkspace(workspace)
}

export function closeWorkspace(): void {
  useWorkspaceStore.getState().setCurrentWorkspace(null)
  useWorkspaceStore.getState().setFiles([])
}
