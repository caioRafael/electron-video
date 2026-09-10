import { WorkspaceEntry } from '@shared/workspace'

export function listWorkspaceFiles(
  workspacePath: string,
): Promise<WorkspaceEntry[]> {
  return window.api.workspace.listFiles(workspacePath)
}
