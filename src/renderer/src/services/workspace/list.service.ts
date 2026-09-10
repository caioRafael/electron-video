import { Workspace } from '@shared/workspace'

export function listWorkspaces(): Promise<Workspace[]> {
  return window.api.workspace.list()
}
