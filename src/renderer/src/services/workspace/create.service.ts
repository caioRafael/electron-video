import { Workspace } from '@shared/workspace'

export function createWorkspace(
  parentDirectory: string,
  name: string,
): Promise<Workspace> {
  return window.api.workspace.create(parentDirectory, name)
}
