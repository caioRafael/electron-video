import { WorkspaceAssets } from '@shared/assets'

export function renameWorkspaceAsset(
  workspacePath: string,
  assetPath: string,
  nextName: string,
): Promise<WorkspaceAssets> {
  return window.api.workspace.renameAsset(workspacePath, assetPath, nextName)
}
