import { WorkspaceAssets } from '@shared/assets'

export function listWorkspaceAssets(
  workspacePath: string,
): Promise<WorkspaceAssets> {
  return window.api.workspace.listAssets(workspacePath)
}
